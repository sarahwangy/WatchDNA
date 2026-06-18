# Project Timeline — Tubelens (YouTube WatchDNA)

## Overview

| Item | Detail |
|------|--------|
| Start | 2026-06-03 |
| End | 2026-06-06 |
| Active Days | 4 |
| Total Commits | 34 |
| Branches | 1 (main) |
| Live Demo | watch-dna.vercel.app |

## Development Timeline

```
2026-06-03  Day 1 — Infrastructure (13 commits)
  - Next.js 14 scaffold with Prisma + Neon PostgreSQL
  - NextAuth v4 with Google OAuth
  - Prisma schema: User, TakeoutFile, WatchEvent, Channel, Video
  - File upload endpoint → Vercel Blob
  - JSZip extract + PapaParse CSV parsing
  - Cheerio HTML parsing for watch-history.html
  - Basic data write to PostgreSQL

2026-06-04  Day 2 — Data pipeline (15 commits)
  - WatchEvent → Channel → Video relationship resolution
  - YouTube Data API enrichment (optional metadata)
  - Claude Haiku insight generation endpoint
  - Calendar heatmap component (Recharts)
  - Top channels ranking table
  - KPI cards: total watches, estimated hours

2026-06-05  Day 3 — Visualization polish (5 commits)
  - Dark mode native design
  - Subscription explorer with filter + sort
  - Insights page layout
  - Mobile responsive layout

2026-06-06  Day 4 — Deploy + cleanup (1 commit)
  - Vercel deployment
  - Environment variables setup
  - Privacy settings page (delete account data)
```

## Milestones

```
Milestone 1 (06-03): Upload + parse pipeline end-to-end
Milestone 2 (06-04): AI insights generating correctly
Milestone 3 (06-04): Dashboard charts rendering
Milestone 4 (06-06): Live on Vercel
```

## Key Decisions

| Decision | Chosen | Reason |
|----------|--------|--------|
| AI model | Claude Haiku | Fast + cheap for batch text analysis |
| DB | Neon PostgreSQL | Serverless-compatible, works with Vercel |
| Parsing | Cheerio + PapaParse | Google Takeout is HTML + CSV, not JSON |
| Storage | Vercel Blob | Native Vercel, no extra config |
