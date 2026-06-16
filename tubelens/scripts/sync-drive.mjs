/**
 * sync-drive.mjs
 * 从 Google Drive 拉取 YouTube Takeout zip，导入全部数据：
 * 观看历史、订阅、评论、播放列表
 * 运行方式: node scripts/sync-drive.mjs
 */

import { google } from 'googleapis';
import { createWriteStream, createReadStream, mkdirSync, existsSync } from 'fs';
import { unlink, readFile } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { Extract } from 'unzipper';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const TMP_DIR = path.join(__dirname, '../.tmp-sync');
const EXTRACTED_DIR = path.join(TMP_DIR, 'extracted');
const KEY_FILE = path.join(__dirname, '../google-service-account.json');
const YT_DIR = path.join(EXTRACTED_DIR, 'Takeout/YouTube and YouTube Music');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// ── Google Drive 工具函数 ───────────────────────────────────────────────────

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}

async function findFolderId(drive, folderName) {
  const res = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });
  const folder = res.data.files?.[0];
  if (!folder) throw new Error(`找不到 Drive 文件夹: ${folderName}`);
  console.log(`✓ 找到文件夹: ${folder.name}`);
  return folder.id;
}

async function findLatestZip(drive, folderId) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and name contains '.zip' and trashed=false`,
    fields: 'files(id, name, size)',
    pageSize: 20,
  });
  const files = res.data.files ?? [];
  if (files.length === 0) throw new Error('文件夹里没有找到 zip 文件');
  // 取最大的 zip（真实数据，archive_browser 那个很小）
  const zip = files.sort((a, b) => Number(b.size) - Number(a.size))[0];
  console.log(`✓ 找到数据 zip: ${zip.name} (${(Number(zip.size) / 1024 / 1024).toFixed(1)} MB)`);
  return zip;
}

async function downloadAndExtract(drive, fileId, fileName) {
  // 如果已经解压过就跳过（开发时节省时间）
  if (existsSync(YT_DIR)) {
    console.log('⚡ 已有解压文件，跳过下载');
    return;
  }
  mkdirSync(TMP_DIR, { recursive: true });
  const zipPath = path.join(TMP_DIR, fileName);
  console.log(`⬇ 下载中: ${fileName}...`);
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
  await pipeline(res.data, createWriteStream(zipPath));
  console.log('📦 解压中...');
  await pipeline(createReadStream(zipPath), Extract({ path: EXTRACTED_DIR }));
  await unlink(zipPath).catch(() => {});
  console.log('✓ 解压完成');
}

// ── CSV 解析工具 ────────────────────────────────────────────────────────────

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    // 简单 CSV 解析，处理引号内的逗号
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    values.push(current.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

// ── 1. 导入订阅 ────────────────────────────────────────────────────────────

async function importSubscriptions(userId) {
  const csvPath = path.join(YT_DIR, 'subscriptions/subscriptions.csv');
  const content = await readFile(csvPath, 'utf-8');
  const rows = parseCSV(content);
  console.log(`\n📋 订阅: ${rows.length} 个频道`);

  let imported = 0;
  for (const row of rows) {
    const channelId = row['Channel ID']?.trim();
    const title = row['Channel title']?.trim();
    if (!channelId) continue;

    // Channel 表用 id 作为 YouTube Channel ID
    await db.channel.upsert({
      where: { id: channelId },
      create: { id: channelId, title: title || channelId },
      update: { title: title || channelId },
    });

    await db.subscription.upsert({
      where: { userId_channelId: { userId, channelId } },
      create: { userId, channelId },
      update: {},
    });
    imported++;
  }
  console.log(`✓ 订阅导入: ${imported} 条`);
}

// ── 2. 导入观看历史 ────────────────────────────────────────────────────────

async function importWatchHistory(userId) {
  const { parse } = await import('node-html-parser');
  const htmlPath = path.join(YT_DIR, 'history/watch-history.html');
  const raw = await readFile(htmlPath, 'utf-8');
  const root = parse(raw);
  const cells = root.querySelectorAll('.content-cell.mdl-typography--body-1');
  console.log(`\n▶ 观看历史: ${cells.length} 条记录`);

  let imported = 0, skipped = 0;
  for (const cell of cells) {
    const links = cell.querySelectorAll('a');
    const videoLink = links[0];
    if (!videoLink?.getAttribute('href')?.includes('watch?v=')) { skipped++; continue; }

    const videoId = new URL(videoLink.getAttribute('href')).searchParams.get('v');
    const videoTitle = videoLink.text.trim();
    const channelName = links[1]?.text.trim() || null;
    const channelUrl = links[1]?.getAttribute('href') || null;
    const timeMatch = cell.text.match(/(\d{1,2} \w+ \d{4}, \d+:\d+:\d+)/);
    const watchedAt = timeMatch ? new Date(timeMatch[1]) : new Date();

    // 建频道（如果还不存在）
    let channelId = null;
    if (channelUrl?.includes('youtube.com')) {
      const rawId = channelUrl.split('/').filter(Boolean).pop();
      // 只有 UC 开头的才是真正的 Channel ID
      const cid = rawId?.startsWith('UC') ? rawId : null;
      if (cid) {
        await db.channel.upsert({
          where: { id: cid },
          create: { id: cid, title: channelName || cid },
          update: {},
        });
        channelId = cid;
      }
    }

    // Video 表有外键约束，先确保 Video 记录存在
    await db.video.upsert({
      where: { id: videoId },
      create: { id: videoId, title: videoTitle, channelId },
      update: {},
    });

    await db.watchEvent.upsert({
      where: { userId_videoId_watchedAt: { userId, videoId, watchedAt } },
      create: { userId, videoId, videoTitle, channelId, watchedAt },
      update: {},
    });

    imported++;
    if (imported % 500 === 0) console.log(`  已导入 ${imported}...`);
  }
  console.log(`✓ 观看历史: ${imported} 条成功, ${skipped} 条跳过`);
}

// ── 3. 导入评论 ────────────────────────────────────────────────────────────

async function importComments(userId) {
  const csvPath = path.join(YT_DIR, 'comments/comments.csv');
  const content = await readFile(csvPath, 'utf-8');
  const rows = parseCSV(content);
  console.log(`\n💬 评论: ${rows.length} 条`);

  let imported = 0;
  for (const row of rows) {
    const videoId = row['Video ID']?.trim();
    const commentedAt = row['Comment create timestamp']
      ? new Date(row['Comment create timestamp'])
      : new Date();

    // Comment text 是 JSON 格式: {"text":"..."}
    let content = '';
    try {
      const parsed = JSON.parse(row['Comment text'] || '{}');
      content = parsed.text || row['Comment text'] || '';
    } catch {
      content = row['Comment text'] || '';
    }
    if (!content) continue;

    await db.comment.create({
      data: { userId, videoId: videoId || null, content, commentedAt },
    });
    imported++;
  }
  console.log(`✓ 评论导入: ${imported} 条`);
}

// ── 4. 导入播放列表 ────────────────────────────────────────────────────────

async function importPlaylists(userId) {
  const playlistsCsvPath = path.join(YT_DIR, 'playlists/playlists.csv');
  const content = await readFile(playlistsCsvPath, 'utf-8');
  const rows = parseCSV(content);
  console.log(`\n📁 播放列表: ${rows.length} 个`);

  let imported = 0;
  for (const row of rows) {
    const playlistId = row['Playlist ID']?.trim();
    const name = row['Playlist title (original)']?.trim() || 'Unnamed';
    const createdAt = row['Playlist create timestamp']
      ? new Date(row['Playlist create timestamp'])
      : new Date();
    if (!playlistId) continue;

    // 建播放列表记录（按名字查重）
    let playlist = await db.playlist.findFirst({ where: { userId, name } });
    if (!playlist) {
      playlist = await db.playlist.create({ data: { userId, name, createdAt } });
    }

    // 找对应的 videos CSV（文件名格式："{播放列表名} videos.csv"）
    const videosCsvPath = path.join(YT_DIR, `playlists/${name} videos.csv`);
    if (!existsSync(videosCsvPath)) continue;

    const videosContent = await readFile(videosCsvPath, 'utf-8');
    const videoRows = parseCSV(videosContent);

    for (const vrow of videoRows) {
      const videoId = vrow['Video ID']?.trim();
      const addedAt = vrow['Playlist video creation timestamp']
        ? new Date(vrow['Playlist video creation timestamp'])
        : new Date();
      if (!videoId) continue;

      await db.playlistItem.create({
        data: { playlistId: playlist.id, videoId, videoTitle: videoId, addedAt },
      });
    }
    imported++;
  }
  console.log(`✓ 播放列表导入: ${imported} 个`);
}

// ── 主流程 ─────────────────────────────────────────────────────────────────

async function main() {
  const folderName = process.env.Google_drive_folder_name;
  if (!folderName) throw new Error('缺少环境变量: Google_drive_folder_name');

  console.log('🚀 开始同步 Google Drive → 数据库');

  // 如果本地已有解压文件就跳过下载，否则从 Drive 拉
  if (!existsSync(YT_DIR)) {
    const drive = getDriveClient();
    const folderId = await findFolderId(drive, folderName);
    const zipFile = await findLatestZip(drive, folderId);
    await downloadAndExtract(drive, zipFile.id, zipFile.name);
  } else {
    console.log('⚡ 使用已有解压文件');
  }

  const user = await db.user.findFirst();
  if (!user) throw new Error('数据库里没有用户，请先在浏览器登录一次');
  console.log(`👤 导入到用户: ${user.email}`);

  await importSubscriptions(user.id);
  await importWatchHistory(user.id);
  await importComments(user.id);
  await importPlaylists(user.id);

  console.log('\n🎉 全部导入完成！');
}

main()
  .catch((e) => { console.error('❌ 错误:', e.message); process.exit(1); })
  .finally(() => db.$disconnect());
