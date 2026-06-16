# I Built a YouTube Analytics Tool with AI in 10 Days as a Beginner — Here's What I Learned

> I'm a beginner web developer. This article documents my journey of building a real, full-stack product from scratch using Next.js and Claude AI — including the bugs I hit, the concepts I learned, and why I think "build something you actually want to use" is the best way to learn coding.

---

## Why I Built This

I had a problem: I'd open YouTube before bed and two hours would disappear.

I subscribe to 118 channels, but realistically watch maybe 20 of them. The rest just sit there — like clothes at the back of a closet you never wear.

I wanted to know: **where is my time actually going?**

YouTube doesn't offer this kind of analytics. Google Takeout lets you export all your data, but the raw files are a mess of HTML and CSV that a normal person can't make sense of.

So I decided to build my own tool.

---

## What I Built

**Tubelens** — a web app that turns your YouTube Takeout data into actionable insights.

Key features:

- 📅 **Calendar Heatmap** — see which days you watched the most; click any day to see the video list
- ⏰ **Hour Heatmap** — discover which day/hour combinations you watch the most
- 🔥 **Streak Tracker** — current and longest watch streaks (like GitHub's contribution graph)
- 📺 **Binge Session Detector** — automatically finds sessions where you watched for 2+ consecutive hours
- 📊 **Channel Comparison** — pick 2–3 channels, compare their monthly watch counts on a line chart
- 🤖 **AI Viewer Profile** — Claude analyzes your data and writes a personalized viewing personality profile
- 💡 **AI Recommendations** — suggests channel types you might like but haven't subscribed to yet
- ⬇️ **CSV Export** — download your watch history and subscription analysis

---

## Tech Stack

As a beginner, I picked mainstream tools with strong communities — if I hit a problem, I needed to be able to find an answer:

| Purpose    | Technology                 | Why                                                            |
| ---------- | -------------------------- | -------------------------------------------------------------- |
| Framework  | Next.js 15 App Router      | Full-stack in one project, no separate backend needed          |
| Styling    | Tailwind CSS               | Write styles directly as classes in JSX, no separate CSS files |
| Database   | Neon PostgreSQL + Prisma   | Free tier + Prisma makes writing queries feel like JavaScript  |
| Auth       | NextAuth v4 (Google OAuth) | One library handles the entire OAuth flow                      |
| AI         | Anthropic Claude API       | Strong reasoning, great for text analysis                      |
| Charts     | Recharts                   | Easiest React charting library to get started with             |
| Deployment | Vercel                     | Push code, it deploys automatically                            |

---

## The Hardest Problems I Hit

### 1. NextAuth Infinite Redirect Loop

This one had me stuck for hours.

**Symptom:** After logging in, the page kept bouncing between `/login` and `/dashboard` endlessly.

**Root cause:** NextAuth defaults to **database sessions** (stored in the DB), but Next.js middleware can only read **JWT sessions** (stored in cookies). These two mechanisms are incompatible — middleware always saw the user as "not logged in."

**Fix** — add one line to `auth-options.ts`:

```typescript
session: {
  strategy: 'jwt';
}
```

And manually inject `user.id` into the token via callbacks:

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

**What I learned:** Authentication libraries have a lot of "hidden assumptions." NextAuth's PrismaAdapter and middleware each have reasonable defaults — but those defaults conflict with each other. When you're combining two features, always check the docs for "using them together," not just each one in isolation.

---

### 2. Prisma v7 Breaking Changes

Prisma v7 introduced a required `PrismaPg` adapter — and the old initialization pattern simply stopped working.

Before (broke in v7):

```typescript
const db = new PrismaClient();
```

After (required in v7):

```typescript
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });
```

**What I learned:** Always check the changelog before upgrading a major version. A `v7` bump means breaking changes. This is what semantic versioning means in practice.

---

### 3. Google Takeout Data Is Messier Than Expected

I assumed I'd get a clean JSON file. What I actually got:

- Watch history: an HTML file where each entry is a `<div>` block
- Subscriptions: a CSV file
- Timestamps: `10 Jun 2026, 21:45:36 AEST` — not standard ISO format

Parsing the watch history required regex to extract timestamps from HTML:

```javascript
const timeMatch = text.match(/(\d{1,2} \w+ \d{4}, \d+:\d+:\d+)/);
```

And I had to sort by file size (not date) to pick the right ZIP — Takeout sometimes generates a tiny `archive_browser.html` file with a newer timestamp that would get picked first.

**What I learned:** Real-world data is always messier than you expect. Before writing any parser, print the raw data and look at it. Don't assume a format.

---

### 4. Building the Binge Session Detector

This was pure JavaScript — no library, just an algorithm.

**Definition:** A "binge session" = consecutive videos where the gap between any two is ≤ 30 minutes, and the total session is ≥ 2 hours.

The algorithm is a classic **sliding window**:

```javascript
let sessionStart = events[0].watchedAt;
let sessionEnd = events[0].watchedAt;
let count = 1;

for (let i = 1; i < events.length; i++) {
  const gap = events[i].watchedAt - events[i - 1].watchedAt;

  if (gap <= 30 * 60 * 1000) {
    // Within threshold — extend the session
    sessionEnd = events[i].watchedAt;
    count++;
  } else {
    // Gap too large — save current session, start a new one
    if (sessionEnd - sessionStart >= 2 * 60 * 60 * 1000) {
      sessions.push({ start: sessionStart, end: sessionEnd, count });
    }
    sessionStart = events[i].watchedAt;
    sessionEnd = events[i].watchedAt;
    count = 1;
  }
}
```

Running it revealed watching patterns I hadn't consciously tracked before.

---

### 5. The Prisma `groupBy` + Weekday Problem

The hour heatmap requires grouping watch events by day-of-week and hour. Prisma's `groupBy` doesn't support extracting weekday or hour from a timestamp directly — that would require raw SQL.

Instead of raw SQL, I fetched all events and filtered in JavaScript:

```javascript
const filtered = events.filter(
  (e) => e.watchedAt.getDay() === day && e.watchedAt.getHours() === hour
);
```

This works fine at 1,400 records. At 100,000 records, you'd want raw SQL with `EXTRACT(DOW FROM ...)`.

**What I learned:** Know the tradeoffs of your approach. "Works for now" is a valid choice when you understand _why_ it works and at what scale it breaks.

---

## What I Discovered About My Own Habits

After running it on my data, I learned things about my viewing habits I hadn't consciously noticed — some expected, some genuinely surprising.

The most interesting part was the **AI viewer profile**. It surfaced content preferences I hadn't explicitly thought about, and picked up on shifts in my interests over the past few months. Data is more honest than memory.

---

## Architecture Overview

```
User's Browser
    ↓ (Google OAuth login)
Next.js App (Vercel)
    ├── Server Components → direct DB queries (no API needed)
    ├── Client Components → interactive UI (charts, filters)
    └── API Routes → AI generation, file export, slot queries
         ↓
Neon PostgreSQL (user's private DB)
    ↑
Google Drive (YouTube Takeout ZIPs)
    ↑ (Service Account, read-only)
sync-drive.mjs (local script, runs on demand)
```

**Privacy note:** All your data stays in your own database. The app never sends your watch history to any third party. The only external API calls are to Claude for AI analysis — and even those only send aggregated category counts, not individual video titles.

---

## What I'd Do Differently

**Use `prisma db push` less, proper migrations more.** I used `db push --accept-data-loss` to quickly iterate on the schema. This is fast for development but dangerous for production — it can silently drop data. The right tool is `prisma migrate dev`.

**Add error boundaries earlier.** Several times, a failed API call crashed the whole page instead of showing a graceful error message. React's `<ErrorBoundary>` should be set up from day one.

**Write integration tests for the parser.** The Takeout parser was the most fragile part — small changes to the HTML format would break it silently. A test with a fixture HTML file would have caught this immediately.

---

## Advice for Other Beginners

**Build something you actually want to use.** Tutorial projects are forgettable. A project that solves your real problem keeps you motivated through the hard parts — because you care about the result.

**Read error messages carefully.** Most of the time, the error message tells you exactly what's wrong. The NextAuth infinite redirect was frustrating, but the root cause was in the docs once I knew where to look.

**Verify at every step.** Don't write 200 lines then run it. Write one function, test it, confirm it works, write the next. When something breaks, you know exactly where to look.

**Use AI as a learning partner, not a ghostwriter.** I used AI assistance throughout this project. But after every piece of code was written, I made sure I understood _why_ it was written that way. There's a difference between AI-assisted learning and just running code you don't understand.

---

## The Code

Open source on GitHub: [github.com/sarahwangy/WatchDNA](https://github.com/sarahwangy/WatchDNA)

If you're curious about your own YouTube habits, you can fork it and self-host — your data stays entirely in your own Neon database, never touching any third-party server.

---

_If this was useful, hit the clap button. Questions? Drop them in the comments._
