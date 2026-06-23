# I Vibe-Coded an AI That Analysed My 3 Years of YouTube History — And Got Roasted by My Own Data

### How I built WatchDNA: a full-stack Next.js app that parses your Google Takeout export, stores it in PostgreSQL, and lets Claude Haiku tell you exactly what kind of person your watch history says you are.

---

I always told myself I was a "focused, intentional YouTube user." I watched tutorials, tech talks, the occasional documentary. Wholesome stuff.

Then I uploaded three years of my own YouTube history to an app I built, and Claude told me I had spent a statistically significant chunk of my evenings binge-watching cooking competitions after 10 PM — and that my subscriptions were 80% tech channels I had not actually watched in over six months.

I built WatchDNA (also called Tubelens in earlier commits) to stop lying to myself about my media diet. What I got was a side project that taught me more about Next.js App Router, Prisma, streaming file uploads, and prompting Claude than any course ever could.

This is that story.

---

## What Is WatchDNA?

WatchDNA is a personal YouTube analytics dashboard. You export your data from Google Takeout, upload the `.zip` file, and the app parses every watch event, channel, subscription, search query, liked video, and comment you've ever made on YouTube. Then it stores all of that in a PostgreSQL database, runs it through Claude Haiku, and generates a set of behavioural insights — binge patterns, topic clusters, time-of-day habits, and the uncomfortable gap between what you subscribed to and what you actually watch.

Live demo: **https://watch-dna.vercel.app**
GitHub: **https://github.com/sarahwangy/WatchDNA**

Here is the full data pipeline, start to finish:

```
┌─────────────────────────────────────────────────────────────────┐
│                        WatchDNA Pipeline                        │
└─────────────────────────────────────────────────────────────────┘

User uploads .zip (Google Takeout)
         │
         ▼
[Vercel Blob]  ──── stores raw .zip ────────────────────────────►
         │
         ▼
[JSZip]  ──── unzip in-memory ──────────────────────────────────►
         │
         ├── watch-history.html  ──► [Cheerio]  ──► WatchEvent[]
         ├── subscriptions.csv   ──► [PapaParse] ──► Channel[]
         ├── search-history.json ──► JSON.parse ──► SearchEvent[]
         ├── comments.html       ──► [Cheerio]  ──► Comment[]
         ├── liked-videos.csv    ──► [PapaParse] ──► LikedVideo[]
         └── playlists/*.csv     ──► [PapaParse] ──► Playlist[]
                                          │
                                          ▼
                              [Prisma v7 + Neon PostgreSQL]
                                          │
                                          ▼
                              [Claude Haiku — batch analysis]
                                          │
                                          ▼
                              Insight[] records written to DB
                                          │
                                          ▼
                     ┌────────────────────────────────────────┐
                     │           Next.js Dashboard            │
                     │  • Calendar Heatmap (Recharts)         │
                     │  • KPI Cards (total hours, top topics) │
                     │  • Top Channels Ranking                │
                     │  • AI Insight Cards                    │
                     │  • Explorer (filter + browse)          │
                     └────────────────────────────────────────┘
```

Every piece of that pipeline was a puzzle. Some pieces snapped together cleanly. Others required an embarrassing number of Stack Overflow tabs and one very patient Claude conversation.

---

## The Problem I Was Solving

I have a complicated relationship with YouTube. It is simultaneously my best learning resource and my worst procrastination tool. The problem is that from the inside, both feel identical. Watching a three-hour deep-dive on Rust ownership feels productive. Watching twelve consecutive episodes of a cooking competition at 11 PM also feels, in the moment, like a reasonable choice.

I wanted data. Real data. Not a screen-time widget that says "you watched 4 hours today" — I wanted to know *what* I watched, *when* I watched it, *whether* the channels I subscribed to actually matched my behaviour, and what patterns I had developed that I could not see from day to day.

Google Takeout gives you all of this data. It just gives it to you in the most hostile format imaginable: a single enormous HTML file, a handful of CSVs with inconsistent column names, and some JSON blobs where the schema changed between export versions.

There was no clean API. There was no npm package that handled all of it. I would have to parse it myself.

That friction is exactly what made this project worth building.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | File-based routing, server components, built-in API routes — everything in one repo |
| Language | TypeScript | I wanted strict types across the full stack, especially for Prisma models |
| Database | PostgreSQL via Neon | Serverless Postgres, zero cold-start config, works great on Vercel |
| ORM | Prisma v7 | Type-safe queries, migrations, and the schema-as-documentation pattern |
| Auth | NextAuth v4 (Google OAuth) | Users sign in with Google — thematically appropriate for a YouTube analytics tool |
| AI | Claude Haiku (Anthropic) | Fast, cheap, surprisingly good at structured JSON output; ideal for batch analysis |
| File parsing | JSZip + PapaParse + Cheerio | JSZip unpacks the archive; PapaParse handles CSVs; Cheerio handles the HTML nightmare |
| File storage | Vercel Blob | Temporary storage for uploaded .zip files during the parse pipeline |
| Charts | Recharts | React-native, composable, did not fight me on the calendar heatmap |
| UI | Tailwind CSS + shadcn/ui | Consistent design system without spending a week on CSS |
| Hosting | Vercel | Zero-config deploys, edge functions, matches the Blob storage ecosystem |

---

## APIs Used

### Claude Haiku — Pattern Analysis & Insight Generation

This is the core AI feature. After all the watch events are stored in PostgreSQL, I fire a batch analysis request to Claude Haiku. The prompt includes aggregated statistics: top channels by watch count, hourly distribution of watch events, day-of-week patterns, and the ratio of subscribed channels to actually-watched channels.

Claude's job is to return structured JSON with four insight types:
- **binge_session** — identifies multi-hour consecutive watching blocks
- **topic_cluster** — groups channels into inferred topic categories
- **time_habit** — describes the user's peak hours and whether they are healthy or concerning
- **subscription_drift** — flags channels subscribed but never actually watched recently

I use Claude Haiku specifically (not Sonnet or Opus) because this runs per-user on upload, and speed + cost matter at scale. Haiku handles structured JSON extraction surprisingly well when the prompt is tight.

### Vercel Blob — Zip File Staging

Uploaded `.zip` files can be 50–200MB. I cannot hold them in memory on a serverless function that has a 4.5MB body limit. Vercel Blob solves this: the client uploads directly to Blob storage, I get a URL back, and then my parsing pipeline downloads and processes it server-side.

### Prisma v7 + Neon PostgreSQL — Persistent Storage

Every parsed entity (WatchEvent, Channel, Subscription, SearchEvent, Comment, LikedVideo, Playlist, Insight) is stored relationally. Prisma v7's type-safe client means every query has autocomplete and compile-time validation — I caught three data modelling mistakes before they ever hit the database.

### NextAuth v4 (Google OAuth) — Authentication

Users sign in with Google. The session ties their `userId` to all data in the database. Nothing fancy — but NextAuth's App Router adapter took a while to configure correctly, and I learned more about JWT sessions and CSRF tokens than I expected.

---

## AI Skills & Techniques

### 1. Structured JSON Output with a Strict Response Schema

The most important Claude technique I used was forcing structured output. Instead of asking Claude to "analyse my YouTube habits," I gave it an explicit JSON schema in the prompt and told it to return *only* that schema, no prose, no explanation.

```typescript
// src/lib/ai/generateInsights.ts

const SYSTEM_PROMPT = `You are a media behaviour analyst. 
You receive aggregated YouTube watch statistics and return ONLY valid JSON.
No explanations. No markdown. No prose. Just the JSON object.`;

const USER_PROMPT = `Analyse this YouTube viewing profile and return insights as JSON.

Watch profile:
- Total watch events: ${stats.totalWatches}
- Top channels: ${JSON.stringify(stats.topChannels.slice(0, 15))}
- Hourly distribution: ${JSON.stringify(stats.hourlyBuckets)}
- Day-of-week distribution: ${JSON.stringify(stats.dailyBuckets)}
- Subscription count: ${stats.subscriptionCount}
- Channels actually watched in last 90 days: ${stats.activeChannelCount}
- Longest binge session (hours): ${stats.longestBingeHours}

Return this exact JSON structure:
{
  "insights": [
    {
      "type": "binge_session" | "topic_cluster" | "time_habit" | "subscription_drift",
      "title": "string (max 60 chars)",
      "summary": "string (max 200 chars)",
      "severity": "info" | "warning" | "critical",
      "data": { ... }
    }
  ]
}`;

const response = await anthropic.messages.create({
  model: "claude-haiku-4-5",
  max_tokens: 2048,
  system: SYSTEM_PROMPT,
  messages: [{ role: "user", content: USER_PROMPT }],
});

const text = response.content[0].type === "text" ? response.content[0].text : "";
const parsed = JSON.parse(text);
```

The key insight here: Claude Haiku is very good at following a strict schema when you give it the exact JSON structure in the prompt. I stopped getting prose-contaminated responses as soon as I added the "No markdown. No prose. Just the JSON object." line to the system prompt.

### 2. Cheerio for Scraping Google's Hostile HTML Export

Google's `watch-history.html` is not a clean data export. It is a rendered webpage — the kind that was clearly generated by dumping server-side template output into a file and calling it a day. Each watch event is a `<div class="content-cell mdl-cell mdl-cell--6-col mdl-typography--body-1">` block containing a link, a timestamp string, and sometimes a channel name. No IDs. No data attributes. Just nested divs and anchor tags.

```typescript
// src/lib/parsers/parseWatchHistory.ts

import * as cheerio from "cheerio";

export interface ParsedWatchEvent {
  videoId: string | null;
  videoTitle: string;
  channelName: string | null;
  channelUrl: string | null;
  watchedAt: Date | null;
  rawUrl: string | null;
}

export function parseWatchHistoryHtml(html: string): ParsedWatchEvent[] {
  const $ = cheerio.load(html);
  const events: ParsedWatchEvent[] = [];

  // Each watch event lives in a content-cell div
  $(".content-cell.mdl-cell--6-col").each((_, el) => {
    const links = $(el).find("a");
    
    // First anchor = the video link
    const videoLink = links.eq(0);
    const videoUrl = videoLink.attr("href") ?? null;
    const videoTitle = videoLink.text().trim();

    // Second anchor (if present) = the channel link
    const channelLink = links.eq(1);
    const channelName = channelLink.length ? channelLink.text().trim() : null;
    const channelUrl = channelLink.length ? channelLink.attr("href") ?? null : null;

    // Timestamp is a text node after the links — not wrapped in a tag
    const rawText = $(el).text();
    const timestampMatch = rawText.match(
      /(\w+ \d{1,2}, \d{4},?\s+\d{1,2}:\d{2}:\d{2}\s+[AP]M)/i
    );
    const watchedAt = timestampMatch
      ? new Date(timestampMatch[1])
      : null;

    // Extract videoId from YouTube URL
    let videoId: string | null = null;
    if (videoUrl?.includes("youtube.com/watch")) {
      try {
        const url = new URL(videoUrl);
        videoId = url.searchParams.get("v");
      } catch {
        videoId = null;
      }
    }

    // Skip non-video entries (ads, YouTube Music, etc.)
    if (!videoTitle || videoTitle === "Watched a video that has been removed") {
      return;
    }

    events.push({
      videoId,
      videoTitle,
      channelName,
      channelUrl,
      watchedAt,
      rawUrl: videoUrl,
    });
  });

  return events;
}
```

The frustrating part was discovering that the CSS class names changed between Google Takeout export versions. I had to add a fallback selector and test against three different exports before the parser was reliable. The timestamp regex alone went through five iterations.

### 3. Prisma Schema — Relational Data Modelling

Getting the schema right early saved me hours of migrations later. The key decision was to make `Channel` a first-class entity that both `WatchEvent` and `Subscription` reference, rather than storing channel names as raw strings.

```prisma
// prisma/schema.prisma (excerpt)

model WatchEvent {
  id          String    @id @default(cuid())
  userId      String
  videoId     String?
  videoTitle  String
  channelId   String?
  watchedAt   DateTime?
  rawUrl      String?
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  channel     Channel?  @relation(fields: [channelId], references: [id])

  @@index([userId])
  @@index([watchedAt])
  @@index([channelId])
}

model Insight {
  id          String    @id @default(cuid())
  userId      String
  type        String    // binge_session | topic_cluster | time_habit | subscription_drift
  title       String
  summary     String
  severity    String    @default("info")
  data        Json?
  generatedAt DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([type])
}

model Channel {
  id          String        @id @default(cuid())
  channelUrl  String        @unique
  channelName String
  userId      String
  createdAt   DateTime      @default(now())

  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  watchEvents WatchEvent[]
  subscriptions Subscription[]

  @@index([userId])
  @@index([channelUrl])
}
```

The `@@index` decorators on `userId` and `watchedAt` were added after I noticed the dashboard query taking 3+ seconds on a 40,000-row dataset. Adding those indexes brought it to under 200ms.

### 4. Dashboard Data Fetching with Promise.all

The dashboard needs several independent data aggregations simultaneously: total watch count, top channels, hourly distribution, and the most recent insights. Running these sequentially would mean each query waiting for the previous one. `Promise.all` fires them in parallel.

```typescript
// src/app/dashboard/page.tsx

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const userId = session.user.id;

  const [
    totalWatches,
    topChannels,
    hourlyDistribution,
    recentInsights,
    watchHeatmapData,
  ] = await Promise.all([
    // Total watch events
    prisma.watchEvent.count({ where: { userId } }),

    // Top 10 channels by watch count
    prisma.watchEvent.groupBy({
      by: ["channelId"],
      where: { userId, channelId: { not: null } },
      _count: { channelId: true },
      orderBy: { _count: { channelId: "desc" } },
      take: 10,
    }),

    // Hourly distribution (raw SQL for efficiency)
    prisma.$queryRaw<{ hour: number; count: number }[]>`
      SELECT EXTRACT(HOUR FROM "watchedAt")::int AS hour,
             COUNT(*)::int AS count
      FROM "WatchEvent"
      WHERE "userId" = ${userId}
        AND "watchedAt" IS NOT NULL
      GROUP BY hour
      ORDER BY hour
    `,

    // Latest AI insights
    prisma.insight.findMany({
      where: { userId },
      orderBy: { generatedAt: "desc" },
      take: 6,
    }),

    // Calendar heatmap: daily watch counts for the last 365 days
    prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT DATE("watchedAt")::text AS date,
             COUNT(*)::int AS count
      FROM "WatchEvent"
      WHERE "userId" = ${userId}
        AND "watchedAt" >= NOW() - INTERVAL '365 days'
      GROUP BY date
      ORDER BY date
    `,
  ]);

  return (
    <DashboardClient
      totalWatches={totalWatches}
      topChannels={topChannels}
      hourlyDistribution={hourlyDistribution}
      recentInsights={recentInsights}
      watchHeatmapData={watchHeatmapData}
    />
  );
}
```

This pattern — `Promise.all` in a server component, then pass the results to a client component for rendering — became my standard dashboard pattern. It keeps data fetching on the server and interactivity on the client, which is exactly what App Router was designed for.

### 5. Vercel Blob Upload Handler

The file upload flow has two steps: (1) the browser uploads the `.zip` directly to Vercel Blob via a presigned URL, (2) the app calls the parse API with the blob URL. This avoids ever sending the full file through Next.js's serverless function body limit.

```typescript
// src/app/api/upload/route.ts

import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.name.endsWith(".zip")) {
    return NextResponse.json(
      { error: "Only .zip files from Google Takeout are supported" },
      { status: 400 }
    );
  }

  // Upload to Vercel Blob — the file lives here temporarily during parsing
  const blob = await put(
    `takeout/${session.user.id}/${Date.now()}-${file.name}`,
    file,
    {
      access: "private",
      addRandomSuffix: false,
    }
  );

  // Return the blob URL so the client can kick off the parse pipeline
  return NextResponse.json({
    blobUrl: blob.url,
    size: file.size,
    filename: file.name,
  });
}
```

One gotcha: Vercel Blob's `access: "private"` option means the URL requires a token to access. This is what I want for user data privacy — but I had to make sure the parse pipeline used the authenticated Blob client, not a raw `fetch`, to download the file. That took an afternoon to debug.

---

## The Vibe Coding Process

I did not build WatchDNA by sitting down and writing code top-to-bottom. I built it using a structured AI-assisted workflow that I've come to call "vibe coding" — though the name is misleading, because the process is actually very deliberate.

Here is the workflow I used, built on a set of Claude Code skills:

### Step 1 — `superpowers:brainstorming`

Before writing a single line of code, I used the brainstorming skill to explore intent. This is not about generating code. It is about answering the question: *what are we actually building, and why?*

For WatchDNA, this step surfaced a question I had not thought about: should insights be generated in real-time as the user browses, or pre-computed once after upload? Real-time feels slicker. Pre-computed is far more cost-effective at scale and means the dashboard loads instantly. I went with pre-computed.

That decision shaped the entire data model. Without the brainstorming step, I would have built a real-time system and refactored it three weeks later.

### Step 2 — `superpowers:writing-plans`

This skill generates an implementation plan with actual file paths and code sketches before any implementation starts. For the Cheerio parser feature, the plan looked like:

```
Task: Parse watch-history.html from Google Takeout .zip
Files to create:
  - src/lib/parsers/parseWatchHistory.ts  (Cheerio-based parser)
  - src/lib/parsers/index.ts              (barrel export)
  - src/lib/parsers/__tests__/parseWatchHistory.test.ts

Acceptance criteria:
  - Handles 40,000+ row files without OOM errors
  - Correctly extracts videoId, videoTitle, channelName, watchedAt
  - Gracefully skips removed/unavailable videos
  - Returns empty array (not throws) on malformed input
```

Having explicit acceptance criteria meant I knew when I was *done*. Without them, I kept adding edge cases indefinitely.

### Step 3 — `superpowers:subagent-driven-development`

Each task in the plan ran as an independent agent with its own spec. The key principle: a fresh agent per task, a quality review after each. This prevented context contamination — the agent implementing the Blob upload handler had no knowledge of the Cheerio parser, which meant it could not make assumptions that broke things in subtle ways.

### Step 4 — `superpowers:systematic-debugging`

When something broke — and things broke — I did not just throw more code at the problem. I used the systematic debugging skill, which forces root-cause analysis before attempting a fix. The instinct to "just try changing this line" is almost always wrong and almost always wastes more time than it saves.

The most useful debugging session was when the Cheerio parser silently returned zero events on a real export file. Root cause: Google had changed the CSS class from `content-cell mdl-cell--6-col` to `outer-cell mdl-cell--12-col` in newer Takeout exports. The fix was a two-line change. Finding it required fifteen minutes of systematic analysis.

### Step 5 — `superpowers:verification-before-completion`

No feature was marked done until it was verified against real data, not just unit tests. For the heatmap, "verified" meant uploading my actual Google Takeout export and confirming that the calendar showed correct dates, that the colour scale made sense, and that clicking a day filtered the video list correctly.

This step caught two bugs that tests missed: a timezone offset issue that shifted all events by one day, and a Recharts responsive container that broke on mobile viewports.

---

### Concrete Example: Building the Cheerio Parser

Let me walk through exactly how the Cheerio parser feature was built using this workflow.

**Brainstorming output:** The key question was whether to parse server-side (safer for large files, no browser memory limit) or client-side (faster perceived performance). Answer: server-side, because `watch-history.html` can be 100MB+ and browsers have memory constraints.

**Plan output:** Three files, acceptance criteria as listed above, a note that the timestamp regex would need testing against at least three different locale formats Google might export.

**Implementation:** I gave the subagent the plan, the acceptance criteria, and a real excerpt of the HTML (with personal data stripped) as a test fixture. The agent produced a working parser that handled 95% of cases.

**Debugging:** The remaining 5% were edge cases: YouTube Music watch events (no video URL), YouTube Shorts (different URL format), and ads that appeared in the HTML as "watched" events with no channel. The systematic debugging skill helped me enumerate all the failure modes before patching them.

**Verification:** I ran the parser against my full export (43,211 events) and cross-checked the total against Google's own dashboard. The numbers matched within 2% (the difference was YouTube Music events I intentionally excluded).

Total time from blank file to production-ready parser: about four hours. That includes debugging. I would estimate a traditional approach — no structured AI workflow, no verification step — would have taken two to three days and probably shipped with the edge cases unhandled.

---

## App Pages Walkthrough

### Import Page

The entry point. A drag-and-drop zone accepts `.zip` files from Google Takeout. After upload, a real-time progress tracker shows each phase of the pipeline: *Uploading → Unpacking → Parsing watch history → Parsing subscriptions → Storing to database → Running AI analysis → Done.*

The progress updates use Server-Sent Events (SSE) — a lightweight alternative to WebSockets for one-way server-to-client streaming. Each phase completion triggers a `data:` event that the client reads and translates to a progress bar increment.

The import page also handles errors gracefully. If the `.zip` does not contain `watch-history.html`, the user sees a specific error message with instructions to re-export from Google Takeout with the YouTube data option enabled. Generic "something went wrong" errors are genuinely one of my pet hates in software, so I spent time writing clear, actionable error messages for every known failure mode.

### Dashboard

The dashboard is the core experience. Four KPI cards at the top: total videos watched, total channels watched, estimated hours (using an average 8-minute video length), and longest single binge session in hours.

Below the KPIs is the calendar heatmap — a GitHub-style contribution graph but for YouTube. Each cell is a day; colour intensity maps to watch count. Seeing the heatmap for the first time after a successful import was the moment the project became real to me. Patterns I could not consciously perceive — a concentrated cluster of late-night watching during a stressful month, a complete blank for two weeks during a trip — were suddenly visible at a glance.

Next to the heatmap is the top channels bar chart, ranked by total watch events. Mine was topped by a channel I had forgotten I even subscribed to.

### Insights

The AI analysis page. Each insight is a card with a title, a summary paragraph, a severity badge (info / warning / critical), and a detail section that expands to show the underlying data.

The "critical" severity is reserved for things like: watching more than 60 hours in a single week, having a subscription list that is more than 70% inactive, or having all your watch activity concentrated between midnight and 3 AM for three consecutive months.

The "subscription drift" insight was the one that surprised me most about my own data. I had 180-something tech channel subscriptions. 23 of them accounted for 91% of my actual watch time. The rest were effectively dead weight — noise in my subscription feed that made it harder to find the channels I actually valued.

### Explorer

A paginated, filterable browser for all your watch events. Filter by channel, by date range, by video title keyword. Each row shows the video thumbnail (loaded lazily), the channel name, and the watch date.

The Explorer is also where deleted videos show up — they appear with a grey placeholder and the note "This video is no longer available." Seeing how many videos in my history no longer existed was unexpectedly melancholy. Some were from channels that had been terminated. Others were just removed by their creators. Three years of watch history contains a surprisingly large number of digital ghosts.

### Settings

Account management: view import history (each upload creates a timestamped record), delete all data for a fresh import, and manage the Google OAuth connection. Nothing fancy, but having a clear "delete everything and start over" option was important for privacy confidence.

---

## Example: How the AI Insight Feature Works — Step by Step

Let me trace one specific insight from raw data to rendered card.

**The insight:** "Late-Night Cooking Spiral — You watched 47 cooking and food videos between 10 PM and 1 AM in October. This pattern repeated on 18 of 31 nights."

**Step 1 — Aggregation (after import)**

After all WatchEvents are stored, the insight generation pipeline runs an aggregation query to build the stats object passed to Claude:

```sql
-- Hourly watch distribution
SELECT EXTRACT(HOUR FROM "watchedAt")::int AS hour,
       COUNT(*) AS count
FROM "WatchEvent"
WHERE "userId" = 'user_xyz'
  AND "watchedAt" IS NOT NULL
GROUP BY hour
ORDER BY hour;
```

Results: hours 22, 23, 0 have counts of 280, 195, 142 respectively — much higher than any daytime hour.

**Step 2 — Channel topic inference**

A second query groups the top channels watched during those late-night hours. Claude receives the channel names and infers topics. I do not maintain a hardcoded topic taxonomy — I let Claude classify them in context. "Bon Appétit," "Joshua Weissman," "Babish Culinary Universe," "Internet Shaquille" → Claude classifies these as `food_cooking`.

**Step 3 — Claude Haiku API call**

The aggregated stats (with the channel names and hourly distribution) go to Claude with the structured prompt shown earlier. Claude returns:

```json
{
  "insights": [
    {
      "type": "time_habit",
      "title": "Late-Night Cooking Spiral",
      "summary": "You watched 47 cooking and food videos between 10 PM and 1 AM in October. This pattern repeated on 18 of 31 nights.",
      "severity": "warning",
      "data": {
        "peakHours": [22, 23, 0],
        "topicCluster": "food_cooking",
        "occurrenceDays": 18,
        "totalVideos": 47,
        "month": "October"
      }
    }
  ]
}
```

**Step 4 — Database write**

The parsed insight is written to the `Insight` table with `type: "time_habit"`, the title, summary, severity, and the full `data` object stored as a Postgres JSONB column.

**Step 5 — Dashboard render**

The Insights page fetches all `Insight` records for the user and renders each as a card. The `data.topicCluster` field determines the card's icon. The `severity: "warning"` badge is yellow. The detail section expands to show the raw data as a small table.

Total time from raw WatchEvent rows to rendered insight card: approximately 4 seconds on first import. Subsequent dashboard loads are instant — the insights are pre-computed and cached in the database.

---

## What I Learned

Building WatchDNA taught me things that six months of tutorials had not.

**On Next.js App Router:** The mental model shift from Pages Router to App Router is real. Server components are not just "components that happen to run on the server" — they change how you think about data fetching, component composition, and where state lives. The `Promise.all` pattern in server components clicked something for me that no course explanation had.

**On Prisma:** Schema-as-documentation is not just a marketing phrase. Three months after writing the initial schema, I can read it and instantly understand the data model. The alternative — undocumented raw SQL with implicit relationships — would have been unmaintainable by now.

**On prompting Claude for structured output:** The single biggest improvement in output quality came from adding "No markdown. No prose. Just the JSON object." to the system prompt. Claude is a conversational model by default — it wants to explain its reasoning. Suppressing that instinct for structured extraction tasks dramatically improves reliability.

**On Google's data exports:** They are not designed for developers. They are designed to satisfy a legal requirement (GDPR data portability) with minimum engineering investment. The HTML format is fragile, the column names are inconsistent between exports, and the timestamp format has at least three variants I encountered across different users' exports. Never trust a Google Takeout export to be consistent. Always write defensive parsers.

**On the vibe coding workflow:** The structured AI workflow — brainstorm, plan, implement with subagents, debug systematically, verify before completion — adds overhead at the start of each task. That overhead pays back double on every debugging session you avoid and every refactor you do not have to do because the design was right the first time.

**On looking at your own data:** The most uncomfortable insight was not the late-night cooking spiral. It was the subscription drift analysis — seeing that I had 180+ subscriptions but only 23 channels I actually watched. I had been collecting subscriptions like bookmarks I never revisited. The data made me do an actual subscription cleanup for the first time in years.

That is the thing about building tools for personal data. The technical challenge is interesting. The moment the tool works correctly and shows you something true about yourself — that is why you build it.

---

*WatchDNA is live at [https://watch-dna.vercel.app](https://watch-dna.vercel.app). Source code is at [https://github.com/sarahwangy/WatchDNA](https://github.com/sarahwangy/WatchDNA). If you want to try it, export your YouTube data from [Google Takeout](https://takeout.google.com) with only YouTube selected, upload the .zip, and see what three years of your attention actually looks like.*

*If the cooking spiral insight appears for you too — you are not alone.*

---

**Tags:** `Next.js` `TypeScript` `Prisma` `Claude AI` `Anthropic` `Vibe Coding` `Side Project` `YouTube` `Data Visualization` `PostgreSQL`
