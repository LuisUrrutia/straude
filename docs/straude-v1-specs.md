# Straude v1 — Product Requirements Document

**Version:** 1.0  
**Date:** January 28, 2026  
**Author:** @ohong
**Status:** Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technical Stack](#2-technical-stack)
3. [User Accounts & Authentication](#3-user-accounts--authentication)
4. [Data Model](#4-data-model)
5. [ccusage Integration](#5-ccusage-integration)
6. [Core Features](#6-core-features)
7. [API Specification](#7-api-specification)
8. [UI/UX Specifications](#8-uiux-specifications)
9. [File Upload & Storage](#9-file-upload--storage)
10. [Privacy & Visibility](#10-privacy--visibility)
11. [Out of Scope (v1)](#11-out-of-scope-v1)
12. [Success Metrics](#12-success-metrics)

---

## 1. Overview

### 1.1 Product Summary

Straude is a social platform for tracking and sharing Claude Code usage. Users import their daily usage statistics from the ccusage CLI tool, share their coding sessions with followers, and compete on a global leaderboard.

### 1.2 Tagline

*Strava for Claude Code*

### 1.3 Target Users

- Claude Code power users (professional software engineers, indie hackers, vibe coders)
- Developers who want social accountability and visibility for their AI-assisted coding

### 1.4 Core Value Proposition

- Transform solitary AI-assisted coding into a social, competitive experience
- Provide bragging rights and social proof for Claude Code usage
- Create community around the emerging "vibe coding" phenomenon

---

## 2. Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Authentication | Clerk |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| UI Components | Base UI |
| Hosting | Vercel |
| CLI Tool | npm package (`straude`) |

### 2.1 Repository Structure

```
straude/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/
│       │   ├── (auth)/         # Auth routes (sign-in, sign-up)
│       │   ├── (main)/         # Authenticated routes
│       │   │   ├── feed/
│       │   │   ├── leaderboard/
│       │   │   ├── profile/
│       │   │   └── settings/
│       │   ├── api/
│       │   └── layout.tsx
│       ├── components/
│       ├── lib/
│       └── types/
├── packages/
│   └── cli/                    # Straude CLI tool
└── supabase/
    └── migrations/
```

---

## 3. User Accounts & Authentication

### 3.1 Authentication Methods

Handled by Clerk:
- **Email/password** — Standard signup flow
- **GitHub OAuth** — One-click signup, auto-fills GitHub profile URL

### 3.2 Onboarding Flow

```
1. Sign up (email or GitHub)
2. Create username (unique, alphanumeric + underscores, 3-20 chars)
3. Select country (required, maps to region for leaderboard)
4. Choose visibility (public or private)
5. Optional: Add bio, profile photo, link
6. Redirect to feed
```

### 3.3 Profile Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `username` | string | Yes | Unique, 3-20 chars, alphanumeric + underscore |
| `display_name` | string | No | Shown if set, otherwise username |
| `bio` | string | No | Max 160 chars, single line |
| `avatar_url` | string | No | URL to uploaded image or Clerk default |
| `country` | string | Yes | ISO 3166-1 alpha-2 code |
| `region` | enum | Auto | Derived from country (see 3.4) |
| `link` | string | No | Personal website, max 200 chars |
| `github_username` | string | No | Auto-filled if GitHub OAuth |
| `is_public` | boolean | Yes | Default: true |
| `timezone` | string | Yes | IANA timezone, auto-detected on signup |

### 3.4 Region Mapping

Countries map to regions:

| Region | Countries |
|--------|-----------|
| `north_america` | US, CA, MX, + Caribbean, Central America |
| `south_america` | BR, AR, CL, CO, PE, etc. |
| `europe` | UK, DE, FR, ES, IT, NL, PL, etc. |
| `asia` | CN, JP, KR, IN, SG, ID, etc. |
| `africa` | NG, ZA, EG, KE, etc. |
| `oceania` | AU, NZ, FJ, etc. |

Store a lookup table `countries_to_regions` in the database.

---

## 4. Data Model

### 4.1 Database Schema

```sql
-- Users (synced from Clerk via webhook)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  link TEXT,
  github_username TEXT,
  is_public BOOLEAN DEFAULT true,
  timezone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage data (daily aggregates)
CREATE TABLE daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cost_usd DECIMAL(10, 4) NOT NULL,
  input_tokens BIGINT NOT NULL,
  output_tokens BIGINT NOT NULL,
  cache_creation_tokens BIGINT DEFAULT 0,
  cache_read_tokens BIGINT DEFAULT 0,
  total_tokens BIGINT NOT NULL,
  models JSONB DEFAULT '[]',           -- Array of model names used
  session_count INTEGER DEFAULT 1,
  is_verified BOOLEAN DEFAULT false,   -- true if submitted via CLI
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Posts (user-facing content layer on top of daily_usage)
-- A post is automatically created when usage is uploaded
-- Description and images are optional enhancements
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  daily_usage_id UUID REFERENCES daily_usage(id) ON DELETE CASCADE,
  description TEXT,                    -- Optional, max 500 chars
  images JSONB DEFAULT '[]',           -- Optional, array of image URLs, max 4
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(daily_usage_id)               -- One post per day's usage
);

-- Follows
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Likes
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,               -- Max 500 chars
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_daily_usage_user_date ON daily_usage(user_id, date DESC);
CREATE INDEX idx_daily_usage_date ON daily_usage(date DESC);
CREATE INDEX idx_posts_user ON posts(user_id, created_at DESC);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_comments_post ON comments(post_id, created_at ASC);
```

### 4.2 Derived/Computed Data

**Streaks** — Computed on read. A streak is defined as consecutive days with usage data uploaded. Any usage upload (via CLI or web) counts — description/images are optional.

```sql
-- Find current streak for a user
-- Based on daily_usage records, not posts (since all uploads appear in feed)
WITH ordered_dates AS (
  SELECT DISTINCT date
  FROM daily_usage
  WHERE user_id = $1
  ORDER BY date DESC
),
streak AS (
  SELECT date,
         date - (ROW_NUMBER() OVER (ORDER BY date DESC))::int AS grp
  FROM ordered_dates
)
SELECT COUNT(*) as streak_length
FROM streak
WHERE grp = (SELECT grp FROM streak ORDER BY date DESC LIMIT 1);
```

Note: Streak requires 2+ consecutive days. A single day of usage = streak of 1 (displayed as "1 day"), two consecutive days = streak of 2, etc.

**Leaderboard aggregates** — Use materialized views refreshed hourly:
```sql
CREATE MATERIALIZED VIEW leaderboard_daily AS
SELECT 
  u.id as user_id,
  u.username,
  u.avatar_url,
  u.country,
  u.region,
  SUM(d.cost_usd) as total_cost,
  SUM(d.total_tokens) as total_tokens
FROM users u
JOIN daily_usage d ON d.user_id = u.id
WHERE u.is_public = true
  AND d.date = CURRENT_DATE
GROUP BY u.id;

-- Similar views for weekly, monthly, all_time
```

---

## 5. ccusage Integration

### 5.1 Integration Methods

#### Method A: CLI Tool (Primary, Verified)

Users install the Straude CLI and authenticate once:

```bash
# Install
npm install -g straude

# Authenticate (opens browser for OAuth flow)
straude login

# Push today's usage
straude push

# Push with options
straude push --date 2026-01-28  # Specific date (today only)
straude push --dry-run          # Preview without posting
```

**How it works:**
1. CLI uses ccusage as a library to read local Claude Code data files
2. Computes a SHA-256 hash of the raw usage data
3. POSTs to `/api/usage/submit` with data + hash
4. Server stores `is_verified: true`

**CLI package structure:**
```
packages/cli/
├── src/
│   ├── index.ts           # Entry point
│   ├── commands/
│   │   ├── login.ts       # OAuth flow
│   │   ├── push.ts        # Submit usage
│   │   └── status.ts      # Check streak, rank
│   ├── lib/
│   │   ├── ccusage.ts     # ccusage library wrapper
│   │   ├── auth.ts        # Token management
│   │   └── api.ts         # API client
│   └── config.ts          # ~/.straude/config.json
├── package.json
└── tsconfig.json
```

**Token storage:**
- Stored in `~/.straude/config.json`
- Token is a JWT issued by our API, refreshed on each push

#### Method B: JSON Paste (Fallback, Unverified)

For users who can't or won't use the CLI:

1. User runs: `ccusage daily --json --since YYYYMMDD --until YYYYMMDD`
2. Copies JSON output
3. Pastes into web form at `/settings/import`
4. Server parses, validates schema, stores `is_verified: false`

### 5.2 ccusage Data Schema

Expected input from `ccusage daily --json`:

```typescript
interface CcusageOutput {
  type: "daily";
  data: DailyEntry[];
  summary: Summary;
}

interface DailyEntry {
  date: string;                    // "2026-01-28"
  models: string[];                // ["claude-opus-4-20250514"]
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  costUSD: number;
}

interface Summary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreationTokens: number;
  totalCacheReadTokens: number;
  totalTokens: number;
  totalCostUSD: number;
}
```

### 5.3 Validation Rules

- `date` must be today (in user's timezone) — no backfilling in v1
- `costUSD` must be >= 0
- All token counts must be >= 0
- `models` array must contain valid Claude model identifiers
- If entry for date already exists: update (not duplicate)

---

## 6. Core Features

### 6.1 Feed (Timeline)

**Route:** `/feed`

Displays posts from users the current user follows, ordered by `created_at DESC`.

**Feed item displays:**
- User avatar, username, timestamp
- Description (if any)
- Images (if any) — up to 4, displayed in grid
- Usage stats: cost, tokens, session count
- Verified badge (if CLI-submitted)
- Like count + like button
- Comment count + link to comments
- Share button (copies link to post)

**Pagination:** Infinite scroll, 20 posts per page

**Empty state:** "Follow some builders to see their posts here" with suggested users

### 6.2 Posting Flow

**Behavior:** Every usage upload automatically creates a post that appears in followers' feeds. The description and images are optional enhancements.

**Flow:**
1. User submits usage data (CLI or web)
2. `daily_usage` record created/updated
3. `post` record auto-created (linked to `daily_usage_id`)
4. Post immediately appears in followers' feeds with usage stats
5. User can optionally add/edit:
   - Description (max 500 chars)
   - Up to 4 images
6. Followers see the post with or without description/images

**Feed Display:**
- Posts without description/images show: avatar, username, timestamp, usage stats (cost, tokens), like/comment buttons
- Posts with description/images show the above plus the user's content

**Edit/Delete:**
- Users can edit description and images at any time
- Users can delete their post at any time
- Deleting a post removes it from feeds but retains the `daily_usage` record (preserves leaderboard data)
- If post is deleted, user can re-create it from `/settings/usage` by clicking "Share" on that day's usage

### 6.3 User Profile

**Route:** `/u/[username]`

**Sections:**

1. **Header**
   - Avatar, username, display name
   - Bio
   - Location (country flag + name)
   - Link (clickable)
   - GitHub link (if set)
   - Follow/Unfollow button
   - Follower/Following counts

2. **Stats Card**
   - Global rank (if public)
   - Regional rank (if public)
   - Current streak (days)
   - Total spend (all-time)

3. **Contribution Graph**
   - GitHub-style grid showing daily activity
   - Last 52 weeks (or since account creation)
   - Color intensity based on cost_usd
   - Hover shows: date, cost, tokens

4. **Recent Posts**
   - List of user's posts
   - Infinite scroll

### 6.4 Leaderboard

**Route:** `/leaderboard`

**Filters:**

| Filter | Options |
|--------|---------|
| Time period | Day, Week, Month, All-time |
| Region | Global, North America, South America, Europe, Asia, Africa, Oceania |

**Table columns:**
- Rank (badge)
- Avatar
- Username
- Country flag
- Cost (USD) — primary sort
- Tokens
- Streak (days)

**Behavior:**
- Click row → navigate to user profile
- Current user's row highlighted (if on leaderboard)
- Pagination: 50 per page
- Only public profiles shown

**Rank badge colors:**
- #1: Gold
- #2: Silver
- #3: Bronze
- 4-10: Coral (#C6603F)
- 11+: Warm Gray (#B0AEA5)

### 6.5 Social Features

#### Following

- Follow button on profile pages
- Following/followers lists on profile (paginated)
- Mutual follows indicated

#### Likes

- Heart icon on posts
- Click to like/unlike
- Shows count
- Click count → modal with list of usernames who liked

#### Comments

- Flat list, ordered by `created_at ASC`
- Max 500 chars per comment
- Reply button → prefills `@username ` in input
- Edit/delete own comments
- Load more pagination (20 per page)

### 6.6 Search

**Route:** `/search?q=`

- Search users by username
- Debounced input (300ms)
- Results show: avatar, username, bio snippet, follower count
- Click → navigate to profile

---

## 7. API Specification

### 7.1 Authentication

All authenticated endpoints require Clerk session token in `Authorization: Bearer <token>` header.

### 7.2 Endpoints

#### Usage

```
POST /api/usage/submit
  Body: {
    date: string,              // "2026-01-28"
    data: DailyEntry,          // ccusage data
    hash?: string,             // SHA-256 of raw data (CLI only)
    source: "cli" | "web"
  }
  Response: { usage_id: string, post_url: string }

GET /api/usage/today
  Response: DailyEntry | null
```

#### Posts

```
POST /api/posts
  Body: {
    daily_usage_id: string,
    description?: string,
    images?: string[]          // Uploaded URLs
  }
  Response: Post

GET /api/posts/[id]
  Response: Post with user, likes, comments

PATCH /api/posts/[id]
  Body: { description?, images? }
  Response: Post

DELETE /api/posts/[id]
  Response: { success: true }

GET /api/feed
  Query: { cursor?: string, limit?: number }
  Response: { posts: Post[], next_cursor?: string }
```

#### Social

```
POST /api/follow/[username]
  Response: { following: true }

DELETE /api/follow/[username]
  Response: { following: false }

GET /api/users/[username]/followers
  Query: { cursor?, limit? }
  Response: { users: User[], next_cursor? }

GET /api/users/[username]/following
  Query: { cursor?, limit? }
  Response: { users: User[], next_cursor? }

POST /api/posts/[id]/like
  Response: { liked: true, count: number }

DELETE /api/posts/[id]/like
  Response: { liked: false, count: number }

GET /api/posts/[id]/likes
  Query: { cursor?, limit? }
  Response: { users: User[], next_cursor? }

POST /api/posts/[id]/comments
  Body: { content: string }
  Response: Comment

GET /api/posts/[id]/comments
  Query: { cursor?, limit? }
  Response: { comments: Comment[], next_cursor? }

DELETE /api/comments/[id]
  Response: { success: true }
```

#### Leaderboard

```
GET /api/leaderboard
  Query: {
    period: "day" | "week" | "month" | "all_time",
    region?: string,           // Optional filter
    cursor?: string,
    limit?: number
  }
  Response: {
    entries: LeaderboardEntry[],
    user_rank?: number,        // Current user's rank if on board
    next_cursor?: string
  }
```

#### Profile

```
GET /api/users/[username]
  Response: User with stats

PATCH /api/users/me
  Body: { display_name?, bio?, link?, is_public?, timezone? }
  Response: User

GET /api/users/[username]/contributions
  Response: { 
    data: Array<{ date: string, cost_usd: number }>,
    streak: number
  }
```

#### Search

```
GET /api/search
  Query: { q: string, limit?: number }
  Response: { users: User[] }
```

#### CLI Authentication

```
POST /api/auth/cli/init
  Response: { code: string, verify_url: string }

POST /api/auth/cli/poll
  Body: { code: string }
  Response: { token?: string, status: "pending" | "completed" | "expired" }
```

---

## 8. UI/UX Specifications

*Inspired by Anthropic's brand identity guidelines.*

### 8.1 Color System

#### Primary Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Charcoal** | `#141413` | 20, 20, 19 | Primary text, dark backgrounds, headers |
| **Cream** | `#FAF9F5` | 250, 249, 245 | Page backgrounds, cards, light text on dark |
| **Warm Gray** | `#B0AEA5` | 176, 174, 165 | Secondary text, borders, inactive states |
| **Sand** | `#E8E6DC` | 232, 230, 220 | Dividers, subtle backgrounds, table row alternates |

#### Accent Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Coral** | `#C6603F` | 198, 96, 63 | Primary accent, CTAs, rank badges, verified badge, highlights |
| **Slate Blue** | `#6A9BCC` | 106, 155, 204 | Links, secondary accent, info states, focus rings |
| **Sage** | `#788C5D` | 120, 140, 93 | Success states, positive metrics (lines added), streaks |

#### Semantic Colors

| State | Color | Hex | Usage |
|-------|-------|-----|-------|
| Highlight Row | Coral @ 15% opacity | `rgba(198, 96, 63, 0.15)` | Current user's row in leaderboard |
| Hover | Coral @ 10% opacity | `rgba(198, 96, 63, 0.10)` | Interactive element hover |
| Active Tab | Coral | `#C6603F` | Selected filter/tab underline |
| Inactive Tab | Warm Gray | `#B0AEA5` | Unselected tabs |
| Error | — | `#C94A4A` | Form validation, error messages |
| Verified Badge | Coral | `#C6603F` | CLI-submitted usage indicator |

#### Color Accessibility

All text combinations meet WCAG 2.1 AA standards:

| Combination | Contrast Ratio | Rating |
|-------------|----------------|--------|
| Charcoal on Cream | 14.8:1 | AAA |
| Cream on Charcoal | 14.8:1 | AAA |
| Cream on Coral | 4.5:1 | AA |
| Warm Gray on Cream | 4.6:1 | AA |
| Coral on Cream | 4.5:1 | AA |
| Slate Blue on Cream | 4.5:1 | AA |

### 8.2 Typography

#### Font Stack

```css
/* Headings */
--font-heading: 'Poppins', Arial, sans-serif;

/* Body text */
--font-body: 'Lora', Georgia, serif;

/* Metrics and code */
--font-mono: 'JetBrains Mono', Consolas, 'Courier New', monospace;
```

#### Type Scale

| Element | Font | Size | Weight | Line Height | Letter Spacing | Color |
|---------|------|------|--------|-------------|----------------|-------|
| Page Title | Poppins | 36px | 700 | 1.2 | -0.02em | Charcoal |
| Section Header | Poppins | 24px | 600 | 1.3 | -0.01em | Charcoal |
| Card Title | Poppins | 18px | 600 | 1.4 | 0 | Charcoal |
| Body | Lora | 16px | 400 | 1.6 | 0 | Charcoal |
| Body Small | Lora | 14px | 400 | 1.5 | 0 | Charcoal |
| Caption/Label | Lora | 14px | 400 | 1.4 | 0 | Warm Gray |
| Overline | Poppins | 12px | 600 | 1.4 | 0.08em | Warm Gray |
| Metric Value | JetBrains Mono | 18px | 500 | 1.2 | 0 | Charcoal |
| Metric Label | Lora | 12px | 400 | 1.4 | 0 | Warm Gray |
| Rank Number | Poppins | 16px | 700 | 1 | 0 | Cream (on Coral) |
| Tab Label | Poppins | 14px | 600 | 1 | 0.05em | — |
| Button | Poppins | 14px | 600 | 1 | 0.02em | — |

#### Font Loading

Load Poppins and Lora from Google Fonts. Use `font-display: swap` to prevent FOIT:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Lora:wght@400;500&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
```

### 8.3 Spacing System

Use a 4px base unit for consistent spacing:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing, icon gaps |
| `--space-2` | 8px | Related elements |
| `--space-3` | 12px | Form field padding |
| `--space-4` | 16px | Card padding, standard gaps |
| `--space-5` | 20px | Section gaps |
| `--space-6` | 24px | Card margins |
| `--space-8` | 32px | Section margins |
| `--space-10` | 40px | Page section breaks |
| `--space-12` | 48px | Major section breaks |

### 8.4 Component Specifications

#### Buttons

**Primary Button (CTA):**
```css
background: #C6603F;
color: #FAF9F5;
padding: 12px 24px;
border-radius: 6px;
font: 600 14px/1 Poppins;
letter-spacing: 0.02em;
transition: background 150ms ease;
/* Hover: darken 10% */
/* Active: darken 15% */
/* Disabled: 50% opacity */
```

**Secondary Button:**
```css
background: transparent;
color: #141413;
border: 1px solid #B0AEA5;
padding: 12px 24px;
border-radius: 6px;
/* Hover: background #E8E6DC */
```

**Ghost Button:**
```css
background: transparent;
color: #C6603F;
padding: 12px 24px;
/* Hover: background rgba(198, 96, 63, 0.10) */
```

#### Rank Badge

```css
/* Container */
display: inline-flex;
align-items: center;
justify-content: center;
min-width: 32px;
height: 28px;
padding: 0 10px;
border-radius: 4px;
font: 700 16px/1 Poppins;

/* Rank 1 */
background: linear-gradient(135deg, #FFD700, #FFA500);
color: #141413;

/* Rank 2 */
background: linear-gradient(135deg, #E8E8E8, #C0C0C0);
color: #141413;

/* Rank 3 */
background: linear-gradient(135deg, #DDA15E, #BC6C25);
color: #FAF9F5;

/* Rank 4-10 */
background: #C6603F;
color: #FAF9F5;

/* Rank 11+ */
background: #E8E6DC;
color: #141413;
```

#### Verified Badge

Small checkmark icon next to usage stats on verified posts:

```css
/* Container */
display: inline-flex;
align-items: center;
gap: 4px;
padding: 2px 8px;
border-radius: 12px;
background: rgba(198, 96, 63, 0.15);
color: #C6603F;
font: 500 12px/1 Poppins;
/* Icon: 12px checkmark */
```

Text: "Verified" or just checkmark icon

#### Cards

```css
background: #FAF9F5;
border: 1px solid #E8E6DC;
border-radius: 8px;
padding: 20px;
box-shadow: 0 2px 8px rgba(20, 20, 19, 0.04);
```

#### Leaderboard Row

**Default:**
```css
padding: 16px 20px;
border-bottom: 1px dashed #E8E6DC;
background: #FAF9F5;
transition: background 150ms ease;
/* Hover: background rgba(198, 96, 63, 0.05) */
```

**Current User (Highlighted):**
```css
background: rgba(198, 96, 63, 0.12);
border-left: 4px solid #C6603F;
```

#### Post Card

```css
/* Container */
background: #FAF9F5;
border: 1px solid #E8E6DC;
border-radius: 8px;
overflow: hidden;

/* Header (user info) */
padding: 16px 20px;
display: flex;
align-items: center;
gap: 12px;

/* Avatar */
width: 44px;
height: 44px;
border-radius: 50%;
object-fit: cover;

/* Description */
padding: 0 20px 16px;
font: 400 16px/1.6 Lora;
color: #141413;

/* Image Grid (1-4 images) */
display: grid;
gap: 2px;
/* 1 image: 1 column */
/* 2 images: 2 columns */
/* 3 images: 2 columns, first spans 2 rows */
/* 4 images: 2x2 grid */

/* Stats Bar */
padding: 12px 20px;
background: #E8E6DC;
display: flex;
gap: 24px;
font: 500 14px/1 JetBrains Mono;

/* Actions Bar */
padding: 12px 20px;
border-top: 1px solid #E8E6DC;
display: flex;
gap: 16px;
```

#### Input Fields

```css
background: #FAF9F5;
border: 1px solid #B0AEA5;
border-radius: 6px;
padding: 12px 16px;
font: 400 16px/1.5 Lora;
color: #141413;
transition: border-color 150ms ease, box-shadow 150ms ease;

/* Placeholder */
color: #B0AEA5;

/* Focus */
border-color: #6A9BCC;
box-shadow: 0 0 0 3px rgba(106, 155, 204, 0.2);
outline: none;

/* Error */
border-color: #C94A4A;
```

#### Tabs (Region/Time Filter)

```css
/* Container */
display: flex;
gap: 0;
border-bottom: 1px solid #E8E6DC;

/* Tab */
padding: 12px 20px;
font: 600 14px/1 Poppins;
letter-spacing: 0.05em;
text-transform: uppercase;
color: #B0AEA5;
border-bottom: 2px solid transparent;
transition: color 150ms ease, border-color 150ms ease;
cursor: pointer;

/* Tab Hover */
color: #141413;

/* Tab Active */
color: #C6603F;
border-bottom-color: #C6603F;
```

#### Contribution Graph

```css
/* Cell */
width: 12px;
height: 12px;
border-radius: 2px;
gap: 3px;

/* Intensity levels (cost_usd) */
--level-0: #E8E6DC;  /* $0 */
--level-1: #F0D4C8;  /* $0.01 – $10 */
--level-2: #E4A989;  /* $10.01 – $50 */
--level-3: #C6603F;  /* $50.01 – $100 */
--level-4: #A54D35;  /* $100+ */

/* Tooltip */
background: #141413;
color: #FAF9F5;
padding: 8px 12px;
border-radius: 4px;
font: 400 14px/1.4 Lora;
box-shadow: 0 4px 12px rgba(20, 20, 19, 0.15);
```

#### Avatar

```css
/* Sizes */
--avatar-xs: 24px;   /* Comments */
--avatar-sm: 32px;   /* Leaderboard rows */
--avatar-md: 44px;   /* Post headers, search results */
--avatar-lg: 80px;   /* Profile header */
--avatar-xl: 120px;  /* Own profile page */

/* Style */
border-radius: 50%;
object-fit: cover;
background: #E8E6DC;  /* Fallback */
border: 2px solid #FAF9F5;
box-shadow: 0 2px 4px rgba(20, 20, 19, 0.08);
```

### 8.5 Iconography

Use Lucide React icons for consistency:

| Icon | Usage |
|------|-------|
| `Heart` / `HeartFilled` | Like button |
| `MessageCircle` | Comment button |
| `Share2` | Share button |
| `CheckCircle` | Verified badge |
| `Flame` | Streak indicator |
| `TrendingUp` | Rank change (positive) |
| `TrendingDown` | Rank change (negative) |
| `Globe` | Global leaderboard |
| `MapPin` | Location |
| `Link` | External link |
| `Github` | GitHub profile |
| `Calendar` | Date/contribution graph |
| `Zap` | Tokens |
| `DollarSign` | Cost |
| `Clock` | Time/duration |

Icon sizes: 16px (inline), 20px (buttons), 24px (navigation)

### 8.6 Motion & Animation

```css
/* Timing functions */
--ease-out: cubic-bezier(0.33, 1, 0.68, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

/* Durations */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
```

| Element | Trigger | Animation |
|---------|---------|-----------|
| Button | Hover | Background color, 150ms ease |
| Card | Hover | Box shadow increase, 200ms ease |
| Like button | Click | Scale 1 → 1.2 → 1, heart fills with Coral |
| Tab switch | Click | Underline slides, 150ms ease-in-out |
| Modal | Open | Fade in + scale 0.95 → 1, 250ms ease-out |
| Modal | Close | Fade out + scale 1 → 0.95, 200ms ease-in |
| Toast | Enter | Slide up + fade in, 200ms ease-out |
| Toast | Exit | Fade out, 150ms ease-in |
| Skeleton | Loading | Shimmer gradient animation, 1.5s infinite |
| Rank badge | Rank improves | Scale pulse 1 → 1.15 → 1, 400ms |

### 8.7 Responsive Breakpoints

| Breakpoint | Width | Layout | Notes |
|------------|-------|--------|-------|
| Desktop XL | ≥1440px | 3-column, max-width container | Sidebar fixed |
| Desktop | 1200–1439px | 3-column (sidebar, main, aside) | Sidebar collapsible |
| Tablet | 768–1199px | 2-column (main, aside) | No sidebar, top nav |
| Mobile | <768px | Single column | Bottom nav, stacked cards |

#### Container Widths

```css
--container-sm: 640px;   /* Auth pages */
--container-md: 768px;   /* Settings */
--container-lg: 1024px;  /* Feed, profile */
--container-xl: 1280px;  /* Leaderboard */
```

#### Mobile-Specific Adaptations

- Bottom navigation bar (64px height): Feed, Leaderboard, Post, Profile
- Leaderboard table becomes card list
- Post images stack vertically (1 column)
- Contribution graph horizontally scrollable
- Tabs become horizontal scroll with fade edges

### 8.8 Dark Mode (Future)

Not in v1 scope, but design tokens are structured for future dark mode support:

```css
/* Light mode (default) */
--color-bg-primary: #FAF9F5;
--color-bg-secondary: #E8E6DC;
--color-text-primary: #141413;
--color-text-secondary: #B0AEA5;

/* Dark mode (v2) */
--color-bg-primary: #141413;
--color-bg-secondary: #1E1E1D;
--color-text-primary: #FAF9F5;
--color-text-secondary: #B0AEA5;
```

### 8.9 Focus States & Accessibility

```css
/* Focus ring (keyboard navigation) */
outline: none;
box-shadow: 0 0 0 3px rgba(106, 155, 204, 0.4);

/* Skip link */
position: absolute;
top: -40px;
left: 0;
/* On focus: top: 0 */
```

- All interactive elements must be keyboard accessible
- Minimum touch target: 44×44px on mobile
- Color is never the only indicator of state
- Images require alt text
- Form fields require labels
- Error messages linked to fields via `aria-describedby`

---

## 9. File Upload & Storage

### 9.1 Image Uploads

**Constraints:**
- Max 4 images per post
- Max file size: 5MB per image
- Accepted formats: JPEG, PNG, WebP, GIF
- Images resized on upload: max 1920px on longest edge
- Stored in Supabase Storage bucket: `post-images`

**Upload flow:**
1. Client uploads to `/api/upload` endpoint
2. Server validates file type and size
3. Server resizes if necessary (using Sharp)
4. Server uploads to Supabase Storage
5. Returns public URL
6. Client includes URL in post creation

### 9.2 Avatar Uploads

- Max file size: 2MB
- Accepted formats: JPEG, PNG, WebP
- Resized to 400x400px, cropped square
- Stored in bucket: `avatars`

### 9.3 Storage Structure

```
supabase-storage/
├── avatars/
│   └── [user_id]/
│       └── avatar.[ext]
└── post-images/
    └── [user_id]/
        └── [post_id]/
            └── [uuid].[ext]
```

---

## 10. Privacy & Visibility

### 10.1 Public Profiles

- Appear in global leaderboard
- Posts visible to anyone (even logged out)
- Profile page publicly accessible
- Can be followed by anyone

### 10.2 Private Profiles

- Do NOT appear in leaderboard
- Do NOT see their own rank
- Posts only visible to approved followers
- Profile page shows limited info to non-followers
- Follow requests require approval (v2 — for v1, private users can still be followed, their posts just don't appear in follower feeds unless follower is approved)

**v1 simplification:** Private profiles simply don't appear on leaderboard and their posts don't appear in public. Followers can still see their posts. No approval flow needed.

### 10.3 Data Visibility Matrix

| Data | Public User | Private User (to follower) | Private User (to non-follower) |
|------|-------------|---------------------------|-------------------------------|
| Username | ✓ | ✓ | ✓ |
| Bio | ✓ | ✓ | ✓ |
| Avatar | ✓ | ✓ | ✓ |
| Posts | ✓ | ✓ | ✗ |
| Usage stats | ✓ | ✓ | ✗ |
| Followers count | ✓ | ✓ | ✓ |
| Leaderboard rank | ✓ | ✗ | ✗ |
| Contribution graph | ✓ | ✓ | ✗ |

---

## 11. Out of Scope (v1)

The following features are explicitly deferred:

- **Notifications** — No in-app, email, or push notifications
- **Backfilling** — Cannot post for past dates
- **Teams/Organizations** — Individual accounts only
- **Achievements/Badges** — Deferred to v2
- **Direct Messages** — No private messaging
- **Blocking/Muting** — Basic moderation only
- **API rate limiting analytics** — Basic rate limits only
- **Mobile apps** — Web only (responsive)
- **Webhooks** — No external integrations
- **Export data** — No user data export
- **Account deletion** — Manual process via support
- **Multiple linked accounts** — One Clerk account per user

---

## 12. Success Metrics

### 12.1 Launch Targets (Week 1)

| Metric | Target |
|--------|--------|
| Signups | 500 |
| Daily active users | 100 |
| Posts created | 300 |
| CLI installs | 200 |

### 12.2 Growth Metrics (Month 1)

| Metric | Target |
|--------|--------|
| Total users | 2,000 |
| WAU | 500 |
| Posts per day | 100 |
| Avg session duration | 3 min |
| Follow ratio (follows/user) | 5 |

### 12.3 Engagement Metrics

- Posts per active user per week
- Likes per post (avg)
- Comments per post (avg)
- CLI vs web submission ratio
- Streak distribution (% users with 7+ day streak)

### 12.4 Tracking Implementation

- Vercel Analytics for page views
- Custom events via Supabase or PostHog:
  - `signup_completed`
  - `usage_submitted` (with source: cli/web)
  - `post_created`
  - `follow_action`
  - `like_action`
  - `leaderboard_viewed` (with filters)

---

## Appendix A: Environment Variables

```bash
# Next.js
NEXT_PUBLIC_APP_URL=https://straude.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# CLI
CLI_JWT_SECRET=
```

---

## Appendix B: CLI Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  User Terminal                    Straude Web                       │
│  ─────────────                    ───────────                       │
│                                                                     │
│  $ straude login                                                    │
│       │                                                             │
│       ├──► POST /api/auth/cli/init                                  │
│       │         │                                                   │
│       │         ▼                                                   │
│       │    Generate code: "ABCD-1234"                               │
│       │         │                                                   │
│       │    ◄────┘ { code, verify_url }                              │
│       │                                                             │
│       ├──► Open browser: straude.com/cli/verify?code=ABCD-1234      │
│       │                           │                                 │
│       │                           ▼                                 │
│       │                    User logs in (Clerk)                     │
│       │                           │                                 │
│       │                           ▼                                 │
│       │                    Confirm CLI access                       │
│       │                           │                                 │
│       │                           ▼                                 │
│       │                    Mark code as verified                    │
│       │                                                             │
│       ├──► Poll: POST /api/auth/cli/poll { code }                   │
│       │         │                                                   │
│       │         ▼                                                   │
│       │    Return JWT token                                         │
│       │         │                                                   │
│       │    ◄────┘ { token, status: "completed" }                    │
│       │                                                             │
│       ▼                                                             │
│  Save token to ~/.straude/config.json                               │
│                                                                     │
│  ✓ Logged in as @username                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Appendix C: Contribution Graph Spec

**Layout:**
- 52 columns (weeks) × 7 rows (days)
- Most recent week on right
- Sunday at top
- Cell size: 12×12px with 3px gap

**Color scale (cost_usd) — Anthropic-inspired palette:**

| Range | Color | Hex |
|-------|-------|-----|
| $0 (no usage) | Sand | `#E8E6DC` |
| $0.01 – $10 | Light Coral | `#F0D4C8` |
| $10.01 – $50 | Medium Coral | `#E4A989` |
| $50.01 – $100 | Coral | `#C6603F` |
| $100+ | Dark Coral | `#A54D35` |

**Tooltip styling:**
```css
background: #141413;
color: #FAF9F5;
padding: 8px 12px;
border-radius: 4px;
font: 400 14px/1.4 Lora;
box-shadow: 0 4px 12px rgba(20, 20, 19, 0.15);
```

**Tooltip content:**
```
January 15, 2026
$47.82 · 1.2M tokens
```

**Interactions:**
- Hover: Tooltip with date, cost, tokens
- Click: Navigate to that day's post (if exists)
- Cells with posts have subtle border: `1px solid #B0AEA5`