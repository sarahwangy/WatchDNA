// 负责从 Vercel Blob 下载 ZIP 并识别 Google Takeout 的文件结构
// Google Takeout ZIP 结构：Takeout/YouTube and YouTube Music/...
import JSZip from 'jszip';

// 描述我们关心的 Takeout 文件集合
export interface TakeoutFiles {
  subscriptions: JSZip.JSZipObject | null; // subscriptions.csv
  watchHistory: JSZip.JSZipObject | null; // watch-history.html
  searchHistory: JSZip.JSZipObject | null; // search-history.html
  comments: JSZip.JSZipObject | null; // comments.csv
  likedVideos: JSZip.JSZipObject | null; // liked videos.csv
  playlists: JSZip.JSZipObject[]; // playlists/*.csv（可能有多个）
}

export async function loadTakeoutZip(blobUrl: string): Promise<TakeoutFiles> {
  // 从 Blob URL 下载文件到内存（不写磁盘，Vercel 函数没有持久磁盘）
  const response = await fetch(blobUrl);
  if (!response.ok) throw new Error(`Failed to download zip: ${response.status}`);

  // arrayBuffer() 把响应体读成二进制，JSZip 需要这种格式
  const buffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const files: TakeoutFiles = {
    subscriptions: null,
    watchHistory: null,
    searchHistory: null,
    comments: null,
    likedVideos: null,
    playlists: [],
  };

  // 遍历 ZIP 内所有条目，按文件名末尾匹配（不依赖完整路径，更健壮）
  zip.forEach((relativePath, file) => {
    if (file.dir) return; // 跳过目录条目
    const lower = relativePath.toLowerCase();

    if (lower.endsWith('subscriptions.csv')) {
      files.subscriptions = file;
    } else if (lower.endsWith('watch-history.html')) {
      files.watchHistory = file;
    } else if (lower.endsWith('search-history.html')) {
      files.searchHistory = file;
    } else if (lower.endsWith('comments.csv')) {
      files.comments = file;
    } else if (lower.match(/liked.videos\.csv$/)) {
      files.likedVideos = file;
    } else if (lower.includes('playlists/') && lower.endsWith('.csv')) {
      files.playlists.push(file);
    }
  });

  return files;
}
