// 删除账号 API：按外键依赖顺序删除，防止约束报错
// 行业常用模式：用 $transaction 保证原子性——要么全删成功，要么全部回滚
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE() {
  // requireUser() 是项目封装的鉴权工具，未登录直接返回 401
  const { user, error } = await requireUser();
  if (error) return error;

  const userId = user!.id;

  // Prisma $transaction：把多个操作打包成一个原子事务
  // 顺序很重要：先删子表（有外键引用 user），最后才能删 user 本身
  await db.$transaction([
    db.watchEvent.deleteMany({ where: { userId } }),
    db.searchEvent.deleteMany({ where: { userId } }),
    db.comment.deleteMany({ where: { userId } }),
    db.likedVideo.deleteMany({ where: { userId } }),
    // playlistItem 通过 playlist 间接关联 user，需要嵌套查询
    db.playlistItem.deleteMany({ where: { playlist: { userId } } }),
    db.playlist.deleteMany({ where: { userId } }),
    db.subscription.deleteMany({ where: { userId } }),
    db.takeoutFile.deleteMany({ where: { userId } }),
    db.insight.deleteMany({ where: { userId } }),
    // session 和 account 是 NextAuth 的表，也要清掉
    db.session.deleteMany({ where: { userId } }),
    db.account.deleteMany({ where: { userId } }),
    // 最后删 user 本身
    db.user.delete({ where: { id: userId } }),
  ]);

  return Response.json({ success: true });
}
