# Tubelens 开发时间轴

## 表格：按日期

| 日期       | 完成事项                                           | 解决的问题                                                           | 用到的技术                                                   |
| ---------- | -------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| 2026-06-03 | 项目初始化、环境配置                               | ESLint v9 兼容性报错；Prisma v7 需要 PrismaPg adapter                | Next.js 15 App Router、TypeScript、ESLint、Prettier、Husky   |
| 2026-06-03 | 数据库 Schema 设计（14张表）                       | 设计 User / Channel / WatchEvent / Subscription / Insight 等关联关系 | Prisma ORM、Neon PostgreSQL、数据库外键约束                  |
| 2026-06-03 | Google OAuth 登录 + 路由保护                       | NextAuth 默认 database session 与 middleware JWT 冲突导致无限跳转    | NextAuth v4、PrismaAdapter、JWT strategy、Next.js Middleware |
| 2026-06-04 | YouTube Takeout 数据解析管道                       | HTML 观看历史的时间格式（AEST）解析失败；CSV 编码问题                | JSZip、PapaParse、node-html-parser、正则表达式               |
| 2026-06-04 | 文件上传 + 异步处理队列                            | 大文件上传超时；需要前端轮询任务状态                                 | Next.js API Routes、FormData、状态轮询                       |
| 2026-06-04 | Dashboard 可视化（KPI + 热力图）                   | 日历热力图颜色梯度算法；数据聚合性能                                 | React Server Components、Recharts、Tailwind CSS              |
| 2026-06-04 | 观看时段热力图（7×24矩阵）                         | Prisma 不支持直接提取 weekday/hour，需在 JS 层过滤                   | Prisma groupBy、JavaScript Date API                          |
| 2026-06-04 | 订阅分析页面 + 频道分类饼图                        | bigint 类型在 JSON 序列化时报错                                      | Recharts PieChart、Prisma bigint 处理                        |
| 2026-06-05 | Claude AI 频道分类 + 观众画像生成                  | 批量 API 调用限速；prompt engineering                                | Anthropic Claude API、async/await 并发控制                   |
| 2026-06-05 | AI Insights 页面（画像 + 兴趣变迁 + 取消订阅建议） | 服务端/客户端组件边界划分；router.refresh() 刷新数据                 | Next.js Server/Client Components、useRouter                  |
| 2026-06-05 | 落地页 + 设置页 + 账号管理                         | 数据删除级联问题                                                     | Next.js 动态路由、Prisma 事务                                |
| 2026-06-06 | README 文档 + 部署配置                             | Vercel 环境变量配置；构建时 Prisma generate                          | Vercel、GitHub Actions、环境变量管理                         |
| 2026-06-09 | Google Drive 自动同步脚本                          | Service Account 权限配置；选最大 ZIP 而不是最新 ZIP                  | Google Drive API、googleapis SDK、unzipper                   |
| 2026-06-09 | 数据导入修复（订阅/评论/播放列表）                 | 外键约束：需先创建 Video 再创建 WatchEvent；WatchEvent 唯一约束      | Prisma upsert、@@unique 约束、prisma db push                 |
| 2026-06-09 | OAuth 登录修复（OAuthCreateAccount 错误）          | User 表缺少 emailVerified 字段；cookie 脏数据导致循环跳转            | NextAuth schema 要求、浏览器 cookie 清理                     |
| 2026-06-12 | UI 大批量改进（A-D 组）                            | heatmap 可点击；频道名链接到 YouTube；订阅页过滤/排序/搜索           | React useState、fetch API、CSS 自定义属性                    |
| 2026-06-12 | 搜索页面（实时搜索）                               | Debounce 防抖避免频繁请求                                            | useEffect、useRef、Prisma contains 模糊查询                  |
| 2026-06-12 | 日历热力图可点击（查看当天观看列表）               | 需要新 API 按日期筛选 watchEvent                                     | Next.js API Route、Date range query                          |
| 2026-06-13 | Watch Streak Tracker                               | 连续天数算法：Set 去重 + 排序 + 滑动窗口                             | 纯 JavaScript 算法、React Server Component                   |
| 2026-06-13 | Binge Session Detector                             | 定义"连续观看"：间隔 ≤30 分钟、总时长 ≥2 小时                        | 时间序列分组算法、Prisma 批量查询                            |
| 2026-06-13 | Channel Comparison（折线图对比）                   | Recharts Legend 显示频道名而不是 ID                                  | Recharts LineChart、动态 dataKey、React useCallback          |
| 2026-06-13 | Export to CSV（订阅 + 观看历史）                   | Content-Disposition 响应头触发浏览器下载                             | Next.js Response、CSV 转义规则                               |
| 2026-06-13 | "You Might Like" AI 推荐                           | Prompt 设计：避免推荐用户已订阅的频道                                | Claude API、Prompt Engineering                               |

---

## 时间轴 Diagram

```
Jun 2026
│
├─ 03 ──────────────────────────────────────────────────────────────────
│   🏗️  项目基础设施
│   ├── Next.js 初始化 + TypeScript 配置
│   ├── Prisma Schema（14 张表）+ Neon DB 连接
│   └── Google OAuth 登录 + JWT middleware
│
├─ 04 ──────────────────────────────────────────────────────────────────
│   📦  数据管道 + 可视化
│   ├── YouTube Takeout ZIP 解析（HTML/CSV）
│   ├── 文件上传 API + 异步处理队列
│   ├── Dashboard：KPI Cards + 日历热力图
│   ├── Watching：时段热力图（7×24）+ Top 频道
│   └── Subscriptions：饼图 + 频道列表
│
├─ 05 ──────────────────────────────────────────────────────────────────
│   🤖  AI 功能
│   ├── Claude API 接入（频道分类）
│   ├── 观众画像生成（AI Profile）
│   ├── 兴趣变迁分析
│   ├── 取消订阅建议（AI Unsubscribe）
│   └── 落地页 + 设置 + 账号管理
│
├─ 06 ──────────────────────────────────────────────────────────────────
│   📝  文档 + 部署
│   └── README + Vercel 部署配置
│
├─ 09 ──────────────────────────────────────────────────────────────────
│   🔄  数据同步 + Bug 修复
│   ├── Google Drive Service Account 自动同步脚本
│   ├── 外键约束修复（Video → WatchEvent）
│   └── OAuth 登录修复（emailVerified + JWT session）
│
├─ 12 ──────────────────────────────────────────────────────────────────
│   ✨  UI 改进批次
│   ├── 热力图可点击 → 查看当天/时段视频列表
│   ├── 频道名全站链接到 YouTube
│   ├── 订阅页：搜索 + 过滤 + 排序
│   ├── AI Insights：频道名可点击
│   └── 搜索页面（实时 debounce 搜索）
│
└─ 13 ──────────────────────────────────────────────────────────────────
    🚀  新功能批次
    ├── 🔥 Watch Streak Tracker（连续观看天数）
    ├── 📺 Binge Session Detector（刷剧检测）
    ├── 📊 Channel Comparison（频道折线图对比）
    ├── ⬇️  Export to CSV（数据导出）
    └── 💡 "You Might Like" AI 推荐
```

---

## 技术栈总览

| 层级       | 技术                                        |
| ---------- | ------------------------------------------- |
| 前端框架   | Next.js 15 App Router、React 19、TypeScript |
| 样式       | Tailwind CSS v4                             |
| 数据库     | Neon PostgreSQL + Prisma ORM v7             |
| 认证       | NextAuth v4（Google OAuth + JWT）           |
| AI         | Anthropic Claude API（claude-sonnet）       |
| 数据可视化 | Recharts、@nivo/sankey                      |
| 数据解析   | node-html-parser、PapaParse、JSZip          |
| 云服务     | Google Drive API、Vercel                    |
| 开发工具   | ESLint、Prettier、Husky、Git                |
