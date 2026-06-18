# I Fed My 3 Years of YouTube History to AI — Here's What It Found

Everyone knows they "watch a lot of YouTube." But do you actually know what you watch? How much time goes to genuinely valuable content vs. mindless scrolling?

Tubelens was built to answer that question.

## The Starting Point: Google Takeout

Google lets you export all your data — including your complete YouTube watch history. It comes as a `.zip` file with `watch-history.html` and several CSVs.

The problem: this data is nearly unreadable. Thousands of lines of raw text with no visualization whatsoever.

Tubelens' core job: **turn that raw data into meaningful insights.**

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | PostgreSQL (Neon) via Prisma v7 |
| AI | Anthropic Claude Haiku |
| Parsing | JSZip + PapaParse + Cheerio |
| Charts | Recharts |
| Storage | Vercel Blob |
| Deployment | Vercel |

## The Parse Pipeline

```
Google Takeout .zip
    → JSZip extracts files
    → PapaParse parses CSVs (subscriptions, likes, playlists)
    → Cheerio parses HTML (watch-history.html)
    → Data written to PostgreSQL
    → YouTube Data API enriches video/channel metadata (optional)
    → Claude Haiku generates behavioral insights
```

Parsing `watch-history.html` was the hardest part. Google stores watch history as HTML, not JSON. I used Cheerio for DOM parsing to extract each record's video title, channel name, and watch timestamp.

## What Claude Haiku Does

The AI analysis isn't just "describe the data" — it finds patterns humans can't easily spot themselves:

- **Binge session detection**: watching 10+ videos from one channel within 2 hours — the signature of passive scrolling
- **Topic clustering**: "You actually spent 30% of your time on tech content, 20% on food"
- **Time-of-day habits**: Are you a late-night viewer or a morning one?
- **High-value vs. low-value content ratio**: Long educational videos (>15 min) vs. short entertainment clips

Haiku is fast and cost-effective, making it the right choice for this kind of batch text analysis.

## Dashboard Features

- **Calendar heatmap**: Like GitHub contributions — see your daily watch density
- **Top channels ranking**: Your 20 most-watched channels
- **KPI cards**: Total watch count, estimated hours, most active month
- **Subscription explorer**: Filter and sort all channel data

## Privacy by Design

All data is scoped to the authenticated user (via NextAuth + Google OAuth). Nothing is shared or used for training. Users can delete all their data in one click from Settings.

"Your YouTube data belongs to you" — this isn't a tagline, it's an architectural decision.

## What I Learned

Building the parse pipeline taught me a lot about handling real-world messy data — Google's HTML export format doesn't follow any spec, so parsing required defensive code and edge case handling at every step.

The Claude Haiku integration taught me that AI is most valuable not for generating content, but for surfacing non-obvious patterns in data that would otherwise take humans hours to find.

Tubelens is the first project in a "Digital Footprint" series. Our digital behavior leaves massive traces — but those traces are usually invisible. Making them visible is what this series is about.
