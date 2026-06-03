# Week 1 Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the complete project skeleton — Next.js app, database schema, authentication, file storage, and CI/CD — so every subsequent feature has a solid foundation.

**Architecture:** Next.js 14 App Router with TypeScript; Neon Postgres accessed via Prisma ORM; NextAuth for Google OAuth login; Vercel Blob for zip file storage. The app lives in a `tubelens/` subdirectory, with planning docs staying at the repo root.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Prisma, Neon Postgres, NextAuth v5, Vercel Blob, ESLint, Prettier, Husky

**Tickets covered:** TUB-INFRA-001 → 008, TUB-AUTH-001 → 004

---

## File Map

```
tubelens/                          ← Next.js app root
├── prisma/
│   └── schema.prisma              ← All DB models (12 tables)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts   ← NextAuth handler
│   │   ├── login/
│   │   │   └── page.tsx           ← Login page UI
│   │   └── layout.tsx             ← Root layout
│   ├── lib/
│   │   ├── db.ts                  ← Prisma client singleton
│   │   └── auth.ts                ← requireUser() helper
│   └── middleware.ts              ← Route protection
├── .env.local                     ← Secret keys (never commit)
├── .env.example                   ← Template (safe to commit)
└── .gitignore
```

---

## Task 1: Initialize Next.js Project (TUB-INFRA-001)

**Files:**
- Create: `tubelens/` (entire Next.js project)
- Create: `tubelens/.env.example`

- [ ] **Step 1: Run create-next-app from the repo root**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
npx create-next-app@14 tubelens \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint
```

When prompted:
- "Would you like to use ESLint?" → No (we configure manually next)
- All others → accept defaults

- [ ] **Step 2: Verify it runs**

```bash
cd tubelens
npm run dev
```

Open http://localhost:3000 — should see the default Next.js welcome page. Press Ctrl+C to stop.

- [ ] **Step 3: Create .env.example**

Create `tubelens/.env.example` with this content:

```bash
# Database (from Neon dashboard)
DATABASE_URL=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Vercel Blob (from Vercel dashboard)
BLOB_READ_WRITE_TOKEN=

# YouTube Data API (from Google Cloud Console)
YOUTUBE_API_KEY=

# Claude API (from console.anthropic.com)
ANTHROPIC_API_KEY=
```

- [ ] **Step 4: Create .env.local with placeholder values**

Copy `.env.example` to `.env.local` — you'll fill in real values as you create each service:

```bash
cp .env.example .env.local
```

- [ ] **Step 5: Verify .gitignore covers secrets**

Check `tubelens/.gitignore` contains `.env*.local` — Next.js adds this automatically. Confirm:

```bash
grep "env" .gitignore
```

Expected output should include: `.env*.local`

- [ ] **Step 6: Initial commit**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git init   # only if repo not already initialized
git remote add origin https://github.com/sarahwangy/WatchDNA.git
git add tubelens/ docs/ WatchDNA_PRD.md WathcDNA.md CLAUDE.md
git commit -m "feat: initialize Next.js project scaffold (TUB-INFRA-001)"
git push -u origin main
```

---

## Task 2: Configure ESLint + Prettier + Husky (TUB-INFRA-002)

**Files:**
- Create: `tubelens/.eslintrc.json`
- Create: `tubelens/.prettierrc`
- Modify: `tubelens/package.json`

- [ ] **Step 1: Install ESLint + Prettier packages**

```bash
cd tubelens
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-next prettier eslint-config-prettier eslint-plugin-prettier
```

- [ ] **Step 2: Create .eslintrc.json**

Create `tubelens/.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

- [ ] **Step 3: Create .prettierrc**

Create `tubelens/.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

- [ ] **Step 4: Install and configure Husky**

```bash
npm install -D husky lint-staged
npx husky init
```

Replace contents of `tubelens/.husky/pre-commit` with:

```bash
npx lint-staged
```

Add lint-staged config to `tubelens/package.json` (inside the root JSON object):

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

Also add a lint script to `package.json` scripts:

```json
"lint": "eslint src --ext .ts,.tsx",
"format": "prettier --write src"
```

- [ ] **Step 5: Verify lint passes**

```bash
npm run lint
```

Expected: no errors (may have warnings on the default page.tsx, that's fine).

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: configure ESLint, Prettier, Husky (TUB-INFRA-002)"
git push
```

---

## Task 3: Install shadcn/ui (TUB-INFRA-003)

**Files:**
- Create: `tubelens/components.json`
- Create: `tubelens/src/components/ui/` (auto-generated)
- Modify: `tubelens/src/app/globals.css`
- Modify: `tubelens/tailwind.config.ts`

- [ ] **Step 1: Run shadcn init**

```bash
cd tubelens
npx shadcn@latest init
```

When prompted:
- Style → **Default**
- Base color → **Slate**
- CSS variables → **Yes**

- [ ] **Step 2: Install base components we'll need throughout the project**

```bash
npx shadcn@latest add button card input select dialog toast badge separator
```

- [ ] **Step 3: Verify components installed**

```bash
ls src/components/ui/
```

Expected: `button.tsx`, `card.tsx`, `input.tsx`, etc.

- [ ] **Step 4: Quick smoke test — use a Button in the home page**

Open `src/app/page.tsx`, replace its contents with:

```tsx
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Button>Tubelens is alive 🎬</Button>
    </main>
  );
}
```

Run `npm run dev`, open http://localhost:3000 — should see a styled button. Revert the file after confirming.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: install shadcn/ui with base components (TUB-INFRA-003)"
git push
```

---

## Task 4: Create Neon Postgres Database (TUB-INFRA-004)

**Files:**
- Modify: `tubelens/.env.local` (add DATABASE_URL)

This task is mostly done in the browser. No code to write.

- [ ] **Step 1: Create Neon account and project**

1. Go to https://neon.tech and sign up (free tier)
2. Create a new project: name it **tubelens**
3. Choose region closest to you

- [ ] **Step 2: Copy the connection string**

In the Neon dashboard:
1. Click **Connection Details**
2. Select **Prisma** from the "Connect from" dropdown (gives the correct format)
3. Copy the `DATABASE_URL`

- [ ] **Step 3: Add to .env.local**

Open `tubelens/.env.local`, fill in:

```bash
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

- [ ] **Step 4: Test connection**

```bash
# Install psql if needed: brew install postgresql
psql "$DATABASE_URL" -c "SELECT version();"
```

Expected: PostgreSQL version info printed. If psql not installed, skip — Prisma will test it in Task 5.

---

## Task 5: Install Prisma (TUB-INFRA-005)

**Files:**
- Create: `tubelens/prisma/schema.prisma`
- Create: `tubelens/src/lib/db.ts`
- Modify: `tubelens/package.json`

- [ ] **Step 1: Install Prisma**

```bash
cd tubelens
npm install prisma @prisma/client
npx prisma init
```

This creates `prisma/schema.prisma` and adds `DATABASE_URL` hint to `.env`.

- [ ] **Step 2: Update schema.prisma datasource**

Open `prisma/schema.prisma`, ensure the datasource block looks like:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

- [ ] **Step 3: Create the Prisma client singleton**

Create `tubelens/src/lib/db.ts`:

```typescript
// 行业标准模式：防止开发热重载时创建多个数据库连接
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],  // 开发时打印所有 SQL 查询，方便调试
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

- [ ] **Step 4: Verify connection**

```bash
npx prisma db pull
```

Expected: "The database is empty" or pulls existing schema. Either is fine — just needs to connect without error.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: install Prisma and create db client singleton (TUB-INFRA-005)"
git push
```

---

## Task 6: Write Complete Prisma Schema (TUB-INFRA-006)

**Files:**
- Modify: `tubelens/prisma/schema.prisma`

- [ ] **Step 1: Replace schema.prisma with full schema**

Replace the contents of `tubelens/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               String    @id @default(cuid())
  email            String    @unique
  name             String?
  image            String?
  createdAt        DateTime  @default(now())
  driveConnected   Boolean   @default(false)
  driveRefreshToken String?

  // Relations
  accounts      Account[]
  sessions      Session[]
  takeoutFiles  TakeoutFile[]
  subscriptions Subscription[]
  watchEvents   WatchEvent[]
  searchEvents  SearchEvent[]
  comments      Comment[]
  likedVideos   LikedVideo[]
  playlists     Playlist[]
  insights      Insight[]
}

// NextAuth 需要的表 — 行业标准，不要修改字段名
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model TakeoutFile {
  id           String    @id @default(cuid())
  userId       String
  source       String    // 'manual_upload' | 'drive_sync'
  driveFileId  String?
  fileName     String
  fileSize     BigInt
  blobUrl      String?   // Vercel Blob URL
  uploadedAt   DateTime  @default(now())
  processedAt  DateTime?
  status       String    // 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage String?

  user User @relation(fields: [userId], references: [id])

  @@index([userId, status])
}

model Channel {
  id              String    @id  // YouTube Channel ID (UCxxxxxx)
  title           String
  description     String?
  country         String?
  customUrl       String?
  thumbnailUrl    String?
  subscriberCount BigInt?
  videoCount      Int?
  viewCount       BigInt?
  publishedAt     DateTime?
  topicCategories String[]
  enrichedAt      DateTime?
  aiCategory      String?
  aiTags          String[]

  subscriptions Subscription[]
  watchEvents   WatchEvent[]
  videos        Video[]

  @@index([country])
  @@index([aiCategory])
}

model Subscription {
  id           String    @id @default(cuid())
  userId       String
  channelId    String
  subscribedAt DateTime?

  user    User    @relation(fields: [userId], references: [id])
  channel Channel @relation(fields: [channelId], references: [id])

  @@unique([userId, channelId])
  @@index([userId])
}

model Video {
  id              String    @id  // YouTube Video ID
  title           String
  channelId       String?
  durationSeconds Int?
  publishedAt     DateTime?
  thumbnailUrl    String?

  channel     Channel?    @relation(fields: [channelId], references: [id])
  watchEvents WatchEvent[]
  comments    Comment[]
  likedVideos LikedVideo[]

  @@index([channelId])
}

model WatchEvent {
  id         String   @id @default(cuid())
  userId     String
  videoId    String?
  channelId  String?
  videoTitle String   // 冗余存储：视频可能被删除，但观看记录要留下
  watchedAt  DateTime

  user    User     @relation(fields: [userId], references: [id])
  video   Video?   @relation(fields: [videoId], references: [id])
  channel Channel? @relation(fields: [channelId], references: [id])

  @@index([userId, watchedAt])
  @@index([userId, channelId])
}

model SearchEvent {
  id         String   @id @default(cuid())
  userId     String
  query      String
  searchedAt DateTime

  user User @relation(fields: [userId], references: [id])

  @@index([userId, searchedAt])
}

model Comment {
  id          String   @id @default(cuid())
  userId      String
  videoId     String?
  content     String
  commentedAt DateTime

  user  User   @relation(fields: [userId], references: [id])
  video Video? @relation(fields: [videoId], references: [id])

  @@index([userId])
}

model LikedVideo {
  id      String   @id @default(cuid())
  userId  String
  videoId String
  likedAt DateTime

  user  User  @relation(fields: [userId], references: [id])
  video Video @relation(fields: [videoId], references: [id])

  @@unique([userId, videoId])
}

model Playlist {
  id        String   @id @default(cuid())
  userId    String
  name      String
  createdAt DateTime

  user  User           @relation(fields: [userId], references: [id])
  items PlaylistItem[]
}

model PlaylistItem {
  id         String   @id @default(cuid())
  playlistId String
  videoId    String?
  videoTitle String
  addedAt    DateTime

  playlist Playlist @relation(fields: [playlistId], references: [id])
}

model Insight {
  id          String    @id @default(cuid())
  userId      String
  type        String    // 'viewer_profile' | 'interest_shift' | 'unsubscribe_suggestion' | 'period_summary'
  content     String    @db.Text
  metadata    Json?
  generatedAt DateTime  @default(now())
  validUntil  DateTime?

  user User @relation(fields: [userId], references: [id])

  @@index([userId, type])
}
```

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name init
```

Expected output:
```
✔ Generated Prisma Client
The following migration was created: prisma/migrations/20260603_init/migration.sql
```

- [ ] **Step 3: Verify with Prisma Studio**

```bash
npx prisma studio
```

Opens http://localhost:5555 — you should see all 14 tables listed on the left. Close it when done (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add prisma/ src/lib/db.ts
git commit -m "feat: add complete Prisma schema with all 14 tables (TUB-INFRA-006)"
git push
```

---

## Task 7: Connect GitHub → Vercel (TUB-INFRA-007)

**Files:**
- No code changes — browser-only setup

- [ ] **Step 1: Create Vercel project**

1. Go to https://vercel.com and log in
2. Click **Add New → Project**
3. Import from GitHub: select `sarahwangy/WatchDNA`
4. Set **Root Directory** to `tubelens` (important! our app is in a subdirectory)
5. Framework: Next.js (auto-detected)

- [ ] **Step 2: Add environment variables in Vercel**

In the Vercel project settings → Environment Variables, add:

```
DATABASE_URL         = (paste from Neon)
NEXTAUTH_URL         = https://your-project.vercel.app  (update after deploy)
NEXTAUTH_SECRET      = (generate: openssl rand -base64 32)
GOOGLE_CLIENT_ID     = (from your existing Google OAuth credentials)
GOOGLE_CLIENT_SECRET = (from your existing Google OAuth credentials)
```

Leave `BLOB_READ_WRITE_TOKEN`, `YOUTUBE_API_KEY`, `ANTHROPIC_API_KEY` empty for now.

- [ ] **Step 3: Deploy and verify**

Click **Deploy**. Wait ~2 minutes. Visit the generated URL (e.g. `https://watchdna.vercel.app`). Should see the default Next.js page.

- [ ] **Step 4: Update NEXTAUTH_URL**

Copy the Vercel URL, update the `NEXTAUTH_URL` env var in Vercel settings to match, then redeploy.

---

## Task 8: Configure Vercel Blob (TUB-INFRA-008)

**Files:**
- Modify: `tubelens/.env.local` (add BLOB_READ_WRITE_TOKEN)
- Modify: `tubelens/package.json` (add @vercel/blob)

- [ ] **Step 1: Create Blob Store in Vercel**

In the Vercel dashboard:
1. Go to your project → **Storage** tab
2. Click **Create Database** → **Blob**
3. Name: `tubelens-uploads`
4. Click Create

- [ ] **Step 2: Copy token to env**

In the Blob store settings, copy `BLOB_READ_WRITE_TOKEN`. Add to:
- `tubelens/.env.local`
- Vercel project environment variables

- [ ] **Step 3: Install the SDK**

```bash
cd tubelens
npm install @vercel/blob
```

- [ ] **Step 4: Smoke test upload**

Create a temporary test file `tubelens/src/app/api/test-blob/route.ts`:

```typescript
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET() {
  const blob = await put('test.txt', 'hello tubelens', {
    access: 'public',
  });
  return NextResponse.json({ url: blob.url });
}
```

Run `npm run dev`, visit http://localhost:3000/api/test-blob — should return a JSON with a blob URL. Delete this test file after confirming.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: configure Vercel Blob storage (TUB-INFRA-008)"
git push
```

---

## Task 9: Install and Configure NextAuth (TUB-AUTH-001)

**Files:**
- Create: `tubelens/src/app/api/auth/[...nextauth]/route.ts`
- Modify: `tubelens/src/lib/db.ts` → split into `db.ts` + new `auth.ts`
- Modify: `tubelens/.env.local`

- [ ] **Step 1: Install NextAuth and Prisma adapter**

```bash
cd tubelens
npm install next-auth@4 @auth/prisma-adapter
```

> Note: We use next-auth v4 (not v5/beta) for stability.

- [ ] **Step 2: Generate NEXTAUTH_SECRET**

```bash
openssl rand -base64 32
```

Copy the output into `tubelens/.env.local`:

```bash
NEXTAUTH_SECRET=<paste output here>
NEXTAUTH_URL=http://localhost:3000
```

- [ ] **Step 3: Add your Google OAuth redirect URI**

In Google Cloud Console → your existing OAuth credentials → Authorized redirect URIs, add:
```
http://localhost:3000/api/auth/callback/google
https://your-project.vercel.app/api/auth/callback/google
```

- [ ] **Step 4: Create the NextAuth route handler**

Create `tubelens/src/app/api/auth/[...nextauth]/route.ts`:

```typescript
// [...nextauth] 是 Next.js 的"catch-all 路由"
// 意思是 /api/auth/anything 都走这个文件
// NextAuth 用这个来处理 /callback/google, /signout 等所有认证路径

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';

const handler = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // session callback: 把 userId 注入到 session 对象
    // 这样前端任何地方都能拿到当前用户的 ID
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',  // 自定义登录页路径
  },
});

export { handler as GET, handler as POST };
```

- [ ] **Step 5: Extend the Session type**

Create `tubelens/src/types/next-auth.d.ts`:

```typescript
// TypeScript 类型扩展：告诉 TypeScript session.user 上有 id 字段
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
```

- [ ] **Step 6: Wrap app with SessionProvider**

Modify `tubelens/src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tubelens',
  description: 'Understand your YouTube habits',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Create `tubelens/src/components/providers.tsx`:

```typescript
// 'use client' 是必须的：SessionProvider 需要浏览器环境
// 但我们把它隔离在这个小文件里，layout.tsx 本身仍是服务端组件
'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 7: Test login flow**

```bash
npm run dev
```

Visit http://localhost:3000/api/auth/signin — should show Google sign-in button. Complete sign-in. Then visit http://localhost:3000/api/auth/session — should return your user JSON with `id`, `email`, `name`.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: add NextAuth with Google OAuth and Prisma adapter (TUB-AUTH-001)"
git push
```

---

## Task 10: Login Page (TUB-AUTH-002)

**Files:**
- Create: `tubelens/src/app/login/page.tsx`

- [ ] **Step 1: Create the login page**

Create `tubelens/src/app/login/page.tsx`:

```tsx
// 这是服务端组件，检查登录状态并重定向
// getServerSession 是在服务端获取 session 的方法（不是客户端 useSession）
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { LoginButton } from '@/components/auth/login-button';

export default async function LoginPage() {
  const session = await getServerSession();

  // 已登录用户直接跳转 dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Tubelens</h1>
          <p className="text-muted-foreground">
            Understand your YouTube habits
          </p>
        </div>
        <LoginButton />
        <p className="text-center text-xs text-muted-foreground">
          Your data stays private. We only read your Takeout export.
        </p>
      </div>
    </main>
  );
}
```

Create `tubelens/src/components/auth/login-button.tsx`:

```tsx
'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function LoginButton() {
  return (
    <Button
      className="w-full"
      onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
    >
      Continue with Google
    </Button>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Visit http://localhost:3000/login — should see the Tubelens login page with a Google button.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add login page UI (TUB-AUTH-002)"
git push
```

---

## Task 11: Route Protection Middleware (TUB-AUTH-003)

**Files:**
- Create: `tubelens/src/middleware.ts`

- [ ] **Step 1: Create middleware**

Create `tubelens/src/middleware.ts`:

```typescript
// middleware.ts 在每次请求前执行，这里用它来做"门卫"
// 未登录用户访问私有页面时，自动踢到 /login
export { default } from 'next-auth/middleware';

export const config = {
  // matcher 列出需要保护的路径
  // 不在列表里的路径（如 /, /login, /demo）无需登录
  matcher: [
    '/dashboard/:path*',
    '/subscriptions/:path*',
    '/watching/:path*',
    '/insights/:path*',
    '/import/:path*',
    '/settings/:path*',
    '/search/:path*',
  ],
};
```

- [ ] **Step 2: Create a placeholder dashboard page to test**

Create `tubelens/src/app/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </main>
  );
}
```

- [ ] **Step 3: Verify protection works**

1. Log out: visit http://localhost:3000/api/auth/signout
2. Try to visit http://localhost:3000/dashboard
3. Expected: automatically redirected to http://localhost:3000/login

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add route protection middleware (TUB-AUTH-003)"
git push
```

---

## Task 12: API Auth Utility (TUB-AUTH-004)

**Files:**
- Create: `tubelens/src/lib/auth.ts`

- [ ] **Step 1: Create requireUser helper**

Create `tubelens/src/lib/auth.ts`:

```typescript
// 所有 API 路由都会用这个函数来：
// 1. 检查用户是否已登录
// 2. 拿到 userId（用于数据库查询的行级隔离）
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function requireUser() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    // 返回 null 表示"未登录"，调用方负责返回 401
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { user: { id: session.user.id, email: session.user.email }, error: null };
}
```

- [ ] **Step 2: Write a test API route to verify**

Create `tubelens/src/app/api/me/route.ts`:

```typescript
import { requireUser } from '@/lib/auth';

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  return Response.json({ userId: user.id, email: user.email });
}
```

- [ ] **Step 3: Verify**

```bash
# Logged out — should return 401
curl http://localhost:3000/api/me

# Logged in — visit in browser after signing in
# Should return { userId: "...", email: "..." }
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add requireUser auth helper for API routes (TUB-AUTH-004)"
git push
```

---

## Week 1 Done ✅

At the end of Week 1 you will have:
- A deployed Next.js app on Vercel
- A Postgres database with 14 tables
- Google OAuth login working
- Route protection (private pages redirect to login)
- File upload storage configured
- Every commit pushed to https://github.com/sarahwangy/WatchDNA

**Next:** Week 2 — Data pipeline (zip upload → parse → database ingestion)
