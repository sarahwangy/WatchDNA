# 我用 10 天，从零造了一个分析自己 YouTube 观看行为的 AI 工具

> 我是一个刚入门 Web 开发的学习者。这篇文章记录了我从零开始、用 Next.js + Claude AI 构建一个真实产品的完整过程——包括踩过的坑、学到的东西，以及为什么我认为"做自己想用的产品"是最好的学习方式。

---

## 为什么做这个

我有个习惯：睡前刷 YouTube，一刷就是两三个小时。

我订阅了 118 个频道，但我真正看的可能只有 20 个。其他的频道存在那里，就像抽屉里永远不会穿的衣服。

我想知道：**我的时间到底花在哪里了？**

YouTube 官方没有提供这样的分析工具。Google Takeout 可以下载你的全部数据，但下载下来是一堆 HTML 和 CSV 文件，普通人根本看不懂。

所以我决定自己做一个。

---

## 做了什么

**Tubelens**——一个分析你 YouTube 观看行为的 Web 应用。

核心功能：

- 📅 **日历热力图**：哪些天看得最多，点击查看当天的视频列表
- ⏰ **时段热力图**：你最爱在周几几点刷 YouTube
- 🔥 **Streak 追踪**：你连续看了多少天，历史最长记录是什么
- 📺 **刷剧检测**：自动找出你连续 2 小时以上的观看记录
- 📊 **频道对比**：选 2-3 个频道，折线图对比 12 个月的观看趋势
- 🤖 **AI 观众画像**：Claude 根据你的数据生成你的"YouTube 人格"
- 💡 **AI 推荐**：根据你的内容偏好，推荐你可能喜欢但还没订阅的频道类型
- ⬇️ **数据导出**：把分析结果下载成 CSV

---

## 技术选型

我是初学者，所以选的都是"有足够教程、出了问题能查到答案"的主流技术：

| 用途     | 技术选择                    | 为什么选它                               |
| -------- | --------------------------- | ---------------------------------------- |
| 前端框架 | Next.js 15 App Router       | 全栈一体，不用单独搭后端                 |
| 样式     | Tailwind CSS                | 不需要写 CSS 文件，class 直接写在 JSX 里 |
| 数据库   | Neon PostgreSQL + Prisma    | 免费 tier、Prisma 让写 SQL 像写 JS       |
| 登录     | NextAuth v4（Google OAuth） | 一个库搞定 OAuth，不用自己处理 token     |
| AI       | Anthropic Claude API        | 推理能力强，特别适合文本分析             |
| 图表     | Recharts                    | React 生态里最容易上手的图表库           |
| 部署     | Vercel                      | 推代码自动部署，免费                     |

---

## 遇到的最难的问题

### 1. NextAuth 无限跳转

这个问题让我卡了半天。

症状：登录之后，页面一直在 `/login` 和 `/dashboard` 之间循环跳转，停不下来。

原因：NextAuth 默认用 **database session**（session 存在数据库里），但 Next.js middleware 只能读取 **JWT session**（session 存在 cookie 里）。两个机制不兼容，导致 middleware 永远认为用户没登录。

修复方法：在 `auth-options.ts` 里加一行：

```typescript
session: {
  strategy: 'jwt';
}
```

然后在 callback 里把 user.id 手动存进 token：

```typescript
callbacks: {
  jwt({ token, user }) {
    if (user) token.id = user.id;
    return token;
  },
  session({ session, token }) {
    if (session.user) (session.user as any).id = token.id;
    return session;
  },
}
```

**学到的东西**：认证系统有很多"隐藏的假设"。NextAuth 的 PrismaAdapter 和 middleware 各自有默认行为，但这两个默认行为在一起会打架。遇到这种问题，要去看文档里的"配合使用"章节，而不是只看各自的独立文档。

---

### 2. Prisma v7 的破坏性变更

Prisma v7 引入了 `PrismaPg` adapter，这是一个破坏性变更——原来的初始化方式直接就报错了。

原来的写法：

```typescript
const db = new PrismaClient();
```

v7 必须这样写：

```typescript
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });
```

**学到的东西**：升级主要版本前，先看 changelog。`v7` 这样的大版本号意味着有不向后兼容的改动。

---

### 3. YouTube Takeout 数据格式比预期复杂

我以为 Google Takeout 会给我一个整洁的 JSON 文件。实际上拿到的是：

- 观看历史：一个 HTML 文件，每条记录是一个 `<div>` 标签
- 订阅列表：CSV 文件
- 时间格式：`10 Jun 2026, 21:45:36 AEST`（不是标准 ISO 格式）

解析观看历史需要用正则表达式从 HTML 里提取时间：

```javascript
const timeMatch = text.match(/(\d{1,2} \w+ \d{4}, \d+:\d+:\d+)/);
```

**学到的东西**：真实世界的数据总是比你预期的脏。在做任何数据处理之前，先把原始数据打印出来看，不要假设格式。

---

### 4. Binge Session 检测算法

这个功能完全是纯 JavaScript 逻辑，没有用任何库。

定义"刷剧时段"：相邻两个视频间隔 ≤ 30 分钟，且整段持续时间 ≥ 2 小时。

算法是经典的**滑动窗口**：

```javascript
let sessionStart = events[0].watchedAt;
let sessionEnd = events[0].watchedAt;

for (let i = 1; i < events.length; i++) {
  const gap = events[i].watchedAt - events[i - 1].watchedAt;

  if (gap <= 30 * 60 * 1000) {
    // 间隔 ≤ 30 分钟：继续同一个 session
    sessionEnd = events[i].watchedAt;
  } else {
    // 间隔 > 30 分钟：结束当前 session，开始新的
    saveSessions(sessionStart, sessionEnd);
    sessionStart = events[i].watchedAt;
    sessionEnd = events[i].watchedAt;
  }
}
```

运行之后，结果让我对自己的观看习惯有了新的认识。

---

## 最意外的收获

做完这个工具之后，我发现了一些关于自己观看习惯的真相——有些符合预期，有些让我有点意外。

**AI 生成的观众画像**出奇地准确。它能从数据里识别出内容偏好，还能察觉近几个月的兴趣变化方向。这让我意识到，数据比"我以为我喜欢什么"更诚实。

---

## 给其他初学者的建议

**1. 做你自己想用的产品**

教程做完会忘，但做一个你真正想用的工具，你会记住每个细节——因为每个问题都是真实的，每个功能都是你需要的。

**2. 错误信息是最好的老师**

我在这个项目里遇到了几十个报错。每一个报错，我都把完整的错误信息复制下来，搞清楚它在说什么。很多时候，报错信息里已经包含了解决方案。

**3. 从小功能开始，每步都可以验证**

不要一次写很多代码然后才运行。我的习惯是：写一个函数，立刻测试它，确认它工作了，再写下一个。这样出问题的时候，你知道问题在哪里。

**4. 用 AI 辅助学习，但要真正理解代码**

我在整个开发过程中有 AI 的帮助，但每写完一段代码，我都会让它解释"这段代码在做什么"、"为什么要这样写"。用 AI 辅助学习和让 AI 替你写作业是两回事。

---

## 代码开源

项目代码在 GitHub 上：[github.com/sarahwangy/WatchDNA](https://github.com/sarahwangy/WatchDNA)

如果你也对自己的 YouTube 数据感到好奇，可以 fork 下来自己部署——你的数据完全存在你自己的数据库里，不会经过任何第三方服务器。

---

_如果这篇文章对你有帮助，欢迎点个 clap。有问题也可以在评论区问我。_
