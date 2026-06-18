# 我把自己 3 年的 YouTube 观看历史喂给了 AI，结果让我很震惊

每个人都知道自己"很喜欢看 YouTube"。但你知道自己到底看了什么吗？多少时间花在了真正有价值的内容上，多少是在无意识刷视频？

Tubelens 就是为了回答这个问题而构建的。

## 起点：Google Takeout

Google 允许你导出自己所有的数据，包括 YouTube 完整的观看历史。文件是一个 `.zip`，里面包含 watch-history.html 和一堆 CSV。

问题是，这些数据几乎没有可读性——几千行纯文本，没有任何可视化。

Tubelens 的核心功能就是：**把这堆原始数据变成有意义的洞察**。

## 技术架构

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) + TypeScript |
| 数据库 | PostgreSQL (Neon) via Prisma v7 |
| AI | Anthropic Claude Haiku |
| 文件解析 | JSZip + PapaParse + Cheerio |
| 可视化 | Recharts |
| 文件存储 | Vercel Blob |
| 部署 | Vercel |

## 解析管道

上传流程是这样的：

```
Google Takeout .zip
    → JSZip 解压
    → PapaParse 解析 CSV（订阅、点赞、播放列表）
    → Cheerio 解析 HTML（watch-history.html）
    → 数据写入 PostgreSQL
    → YouTube Data API 补全视频/频道元数据（可选）
    → Claude Haiku 生成行为洞察
```

解析 watch-history.html 是最难的部分。Google 把观看记录存成 HTML，不是 JSON，所以要用 Cheerio 做 DOM 解析，提取每条记录的视频标题、频道名、观看时间。

## Claude Haiku 做了什么

AI 分析不是简单地"描述数据"，而是发现人类自己看不出来的模式：

- **Binge session 检测**：在2小时内连续看同一频道10个视频，这是刷视频的典型特征
- **话题聚类**：把视频按主题聚类，发现"你其实花了30%时间在看技术内容，20%在美食"
- **时间段习惯**：你主要是夜间用户还是早晨用户？
- **高价值 vs 低价值内容识别**：长视频（>15分钟）教育内容 vs 短片娱乐内容的比例

Haiku 速度快、成本低，适合做这类批量文本分析。

## Dashboard 可视化

- **Calendar heatmap**：类似 GitHub contribution 图，看每天的观看密度
- **Top channels ranking**：你看得最多的20个频道
- **KPI 卡片**：总观看数、总时长估算、最活跃月份
- **订阅浏览器**：可以过滤、排序所有频道数据

## 隐私设计

这是我最在意的部分。所有数据存在用户自己的数据库（通过 NextAuth + Google OAuth 隔离），没有任何数据会被共享或用于训练。用户可以在设置里一键删除所有数据。

"你的 YouTube 数据属于你自己" — 这不只是一句口号，而是架构层面的决策。

## 总结

把三年的观看历史可视化之后，我发现自己在某些话题上比想象中投入得多，在另一些话题上则几乎没有。这种清晰度本身就有价值。

Tubelens 是 "Digital Footprint 系列" 的第一个项目。我们的数字行为留下了大量痕迹，但这些痕迹通常是不可见的。让它变得可见，是这个系列想做的事。
