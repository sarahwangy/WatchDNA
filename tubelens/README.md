# 🔭 Tubelens

[![Live Demo](https://img.shields.io/badge/demo-watch--dna.vercel.app-blue?style=flat-square)](https://watch-dna.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io)
[![Deployed on Vercel](https://img.shields.io/badge/deployed-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)

> **Turn your YouTube watch history into a personal analytics dashboard — powered by AI.**

Upload your Google Takeout export and Tubelens parses, enriches, and analyzes your entire YouTube history. No third-party data access required — your data stays in your own account.

---

## Why I Built This

I spent hours watching YouTube but had no idea what patterns I had — whether I was binge-watching late at night, which topics I kept coming back to, or whether my subscriptions actually matched what I watched. Google Takeout gives you the raw data but no analysis. Tubelens turns that export into an interactive dashboard with AI insights about your own viewing behaviour.

---

## 📸 Screenshots

<!-- TODO: Replace with actual screenshots -->
<!-- Recommended: Dashboard overview, Insights page, Import flow -->

```
[Dashboard screenshot]       [Insights / AI analysis]
[Watch history calendar]     [Top channels & subscriptions]
```

---

## ✨ Features

- 📦 **One-click import** — Upload your Google Takeout `.zip` directly; Tubelens extracts and parses watch history, subscriptions, likes, playlists, comments, and search history
- 📊 **Visual dashboard** — Calendar heatmap, KPI cards, and top-channels ranking built with Recharts and Server Components
- 🤖 **AI-powered insights** — Claude Haiku analyzes your viewing patterns and surfaces behavioral insights (binge sessions, topic clusters, time-of-day habits)
- 📺 **Watching & subscriptions explorer** — Browse enriched video/channel data with filtering and sorting
- 🔒 **Privacy-first** — All data is scoped to your login; nothing is shared or sold
- 🌙 **Dark-mode native** — Designed for dark environments with full light/dark theme toggle

---

## 🛠 Tech Stack

| Layer            | Technology                                                           |
| ---------------- | -------------------------------------------------------------------- |
| **Frontend**     | Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui, Recharts |
| **Backend**      | Next.js Route Handlers, Server Components, NextAuth v4               |
| **Database**     | PostgreSQL (Neon) via Prisma v7 with `@prisma/adapter-pg`            |
| **AI**           | Anthropic Claude Haiku (`@anthropic-ai/sdk`)                         |
| **File storage** | Vercel Blob                                                          |
| **Parsing**      | PapaParse (CSV), JSZip, Cheerio (HTML)                               |
| **Deployment**   | Vercel (Edge-compatible)                                             |

---

## 🗄 Data Architecture

```
Google Takeout .zip
        │
        ▼
  JSZip + PapaParse          ← extract & parse CSV/HTML files
        │
        ▼
  Prisma / PostgreSQL         ← persist: WatchEvent, Channel, Video,
        │                        Subscription, Playlist, Comment…
        ▼
  YouTube Data API (optional) ← enrich channels & videos with metadata
        │
        ▼
  Claude Haiku                ← generate Insight records per user
        │
        ▼
  Next.js Server Components   ← query DB directly, render dashboard
```

**Key models:** `User · TakeoutFile · WatchEvent · Channel · Video · Subscription · SearchEvent · Comment · LikedVideo · Playlist · Insight`

---

## 🚀 Local Development

### Prerequisites

- Node.js ≥ 18
- PostgreSQL database (local or [Neon](https://neon.tech) free tier)
- Google OAuth credentials
- Anthropic API key

### Environment Variables

Create a `.env.local` file at the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3003"
NEXTAUTH_SECRET="your-secret-here"           # openssl rand -base64 32

# Google OAuth (console.cloud.google.com)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Anthropic (console.anthropic.com)
ANTHROPIC_API_KEY="sk-ant-..."

# Vercel Blob (optional for local, required for production)
BLOB_READ_WRITE_TOKEN="..."

# YouTube Data API v3 (optional — for channel/video enrichment)
YOUTUBE_API_KEY="..."
```

### Setup & Start

```bash
# 1. Install dependencies
npm install

# 2. Push schema to your database
npx prisma db push

# 3. Start dev server (runs on :3003)
npm run dev
```

Open [http://localhost:3003](http://localhost:3003) and sign in with Google.

---

## ☁️ Deploy to Vercel

1. Fork this repo and import it into [Vercel](https://vercel.com/new)
2. Add all environment variables listed above in the Vercel dashboard
3. Set **Framework Preset** → Next.js, **Build Command** → `npm run build`
4. Add a `postinstall` script (already included): `prisma generate`
5. Deploy — Vercel handles the rest

> **Database:** Use [Neon](https://neon.tech) for a serverless-compatible PostgreSQL instance that works out of the box with Vercel.

---

## 🔒 Privacy

- Authentication is handled by NextAuth with Google OAuth
- All uploaded data is stored under your user account in your own database
- Vercel Blob files are access-controlled per upload
- No watch history data is shared with third parties
- You can delete your account and all associated data from Settings → Account

---

## 📄 License

MIT © [sw](mailto:sarahwangdk@gmail.com)
