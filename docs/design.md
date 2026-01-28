# Straude Design Document

**Version 1.0** · January 2026

---

## Brand Identity

### Name & Tagline

**Straude** — *Strava for Claude Code*

Track. Share. Compete.

### Mascot

**Urchie** — A cute, cartoon sea urchin with expressive eyes and friendly spines. Think LINE sticker aesthetic: round, soft, emotive. Urchie appears throughout the UI to celebrate achievements, encourage users, and add personality.

Urchie expressions:
- 😊 **Happy** — Default state, welcoming
- 🎉 **Celebrating** — New high score, climbing leaderboard
- 💪 **Determined** — Streak in progress
- 😴 **Sleepy** — No activity in 3+ days
- 🔥 **On Fire** — Top 10 leaderboard position

---

## Color System

### Primary Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Coral** | `#C6603F` | 198, 96, 63 | Primary accent, rank badges, CTAs, highlights |
| **Cream** | `#FAF9F5` | 250, 249, 245 | Page backgrounds, cards |
| **Charcoal** | `#141413` | 20, 20, 19 | Primary text, headers |

### Secondary Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Warm Gray** | `#B0AEA5` | 176, 174, 165 | Secondary text, borders, inactive states |
| **Sand** | `#E8E6DC` | 232, 230, 220 | Dividers, subtle backgrounds, table rows (alt) |
| **Sage** | `#788C5D` | 120, 140, 93 | Positive metrics (lines added), success states |
| **Slate Blue** | `#6A9BCC` | 106, 155, 204 | Links, secondary accents, info states |

### Semantic Colors

| State | Color | Usage |
|-------|-------|-------|
| **Highlight Row** | `#C6603F` at 15% opacity | Current user's row in leaderboard |
| **Active Tab** | `#C6603F` | Selected filter/tab |
| **Inactive Tab** | `#B0AEA5` | Unselected filter/tab |
| **Hover** | `#C6603F` at 10% opacity | Interactive row hover |

---

## Typography

### Font Stack

**Headings:** Poppins, Arial, sans-serif
**Body:** Lora, Georgia, serif
**Monospace (metrics):** JetBrains Mono, Consolas, monospace

### Scale

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Page Title | Poppins | 36px | 700 | Charcoal |
| Section Header | Poppins | 24px | 600 | Charcoal |
| Card Title | Poppins | 18px | 600 | Charcoal |
| Body | Lora | 16px | 400 | Charcoal |
| Caption/Label | Lora | 14px | 400 | Warm Gray |
| Metric Value | JetBrains Mono | 18px | 500 | Charcoal |
| Rank Number | Poppins | 20px | 700 | Cream (on Coral) |

---

## Components

### 1. Rank Badge

Small pill showing user's position.

```
┌─────────┐
│ 10      │  ← Coral background (#C6603F)
└─────────┘     Cream text (#FAF9F5), Poppins 700
```

- Border radius: 4px
- Padding: 8px 12px
- Min-width: 40px (center-aligned number)

### 2. Leaderboard Row

**Default State:**
```
┌────────────────────────────────────────────────────────────────────┐
│  [7]   @username          $1,247.52    12.4M tokens    +3,891 loc  │
└────────────────────────────────────────────────────────────────────┘
```
- Background: Cream (#FAF9F5)
- Border-bottom: 1px dashed Sand (#E8E6DC)

**Highlighted State (current user):**
```
┌────────────────────────────────────────────────────────────────────┐
│  [7]   @username          $1,247.52    12.4M tokens    +3,891 loc  │
└────────────────────────────────────────────────────────────────────┘
```
- Background: Coral at 15% opacity
- Border-left: 4px solid Coral (#C6603F)

**Expanded State (click to reveal breakdown):**
```
┌────────────────────────────────────────────────────────────────────┐
│  [7]   @username                                          $1,247   │
│        ├─ Cost (USD)                                      $1,247   │
│        ├─ Tokens                                          12.4M    │
│        ├─ Sessions                                           47    │
│        ├─ Lines added                                    +5,102    │
│        └─ Lines removed                                  -1,211    │
└────────────────────────────────────────────────────────────────────┘
```

### 3. Regional Filter Tabs

Horizontal tab bar for filtering leaderboard by region.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  GLOBAL    AMERICAS    EUROPE    ASIA & OCEANIA    AFRICA                   │
│  ──────                                                                     │
│  (active)                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Active tab: Coral text (#C6603F) + underline (2px)
- Inactive tab: Warm Gray text (#B0AEA5)
- Font: Poppins 14px, 600 weight, uppercase, letter-spacing: 0.5px

### 4. Time Period Selector

Segmented control for daily/weekly/monthly/all-time.

```
┌────────┬─────────┬──────────┬───────────┐
│  DAY   │  WEEK   │  MONTH   │ ALL-TIME  │
└────────┴─────────┴──────────┴───────────┘
```

- Selected: Coral background, Cream text
- Unselected: Transparent background, Charcoal text, Sand border
- Border-radius: 6px (outer), 4px (inner segments)

### 5. User Card (Profile Summary)

```
┌─────────────────────────────────────────────┐
│  ┌─────┐                                    │
│  │ AVA │  @username                         │
│  │ TAR │  San Francisco, CA                 │
│  └─────┘                                    │
│                                             │
│  #42 Global          #8 in North America    │
│  ────                ────                   │
│  (Coral badge)       (Slate Blue badge)     │
│                                             │
│  This Week                                  │
│  ─────────────────────────────────────────  │
│  $892.41 spent    │  8.2M tokens            │
│  23 sessions      │  +4,521 lines           │
└─────────────────────────────────────────────┘
```

- Card: Cream background, 1px Sand border, 8px border-radius
- Shadow: 0 2px 8px rgba(20, 20, 19, 0.06)

### 6. Session Post (Feed Item)

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌───┐  @username · 2 hours ago                                 │
│  │AVA│  "Finally shipped the auth flow 🚀"                      │
│  └───┘                                                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │              [Screenshot of shipped work]               │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  $47.82  ·  1.2M tokens  ·  3h 24m  ·  +847 / -122 lines       │
│                                                                 │
│  ♡ 24 likes    💬 8 comments                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 7. Achievement Badge

Small, collectible badges users earn.

```
     ┌───────────┐
     │   🦔⚡    │  ← Urchie variant icon
     │           │
     │  $1K CLUB │  ← Poppins 10px, uppercase
     └───────────┘
```

- Unlocked: Full color, Coral accent
- Locked: Grayscale, Warm Gray text, 50% opacity

Example achievements:
- **First Session** — Import your first session
- **$100 Club** — Spend $100 lifetime
- **$1K Club** — Spend $1,000 lifetime  
- **Streak Week** — 7 consecutive days of activity
- **Night Owl** — Session after midnight
- **Early Bird** — Session before 6am
- **Prolific** — +10,000 lines in one session
- **Top 10** — Reach global top 10

---

## Page Layouts

### Leaderboard Page

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Logo + Urchie]    Feed    Leaderboard    Profile    [Search]   [User]  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                           Leaderboard                                    │
│                                                                          │
│   GLOBAL   AMERICAS   EUROPE   ASIA & OCEANIA   AFRICA                   │
│   ──────                                                                 │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │  [DAY]  [WEEK]  [MONTH]  [ALL-TIME]                              │  │
│   ├──────────────────────────────────────────────────────────────────┤  │
│   │  RANK   USERNAME           COST       TOKENS       LINES   MORE  │  │
│   │  ────   ────────           ────       ──────       ─────   ────  │  │
│   │  [1]    @velocitycoder    $4,892     47.2M       +42,891    ▼   │  │
│   │  [2]    @shipfast         $4,201     39.8M       +38,102    ▼   │  │
│   │  [3]    @vibemaestro      $3,847     35.1M       +29,444    ▼   │  │
│   │  ...                                                             │  │
│   │  [47]   @you (highlighted)  $892      8.2M        +4,521    ▼   │  │
│   │  ...                                                             │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│   ← Previous    Page 1 of 42    Next →                                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Profile Page

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Nav Bar]                                                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────────────────────────┐  ┌─────────────────────────────┐ │
│   │  [Large Avatar]                  │  │  Global Standings           │ │
│   │                                  │  │                             │ │
│   │  @username                       │  │  #47 Global    #12 Americas │ │
│   │  🦔 "Vibe coding my way to..."   │  │                             │ │
│   │  📍 San Francisco, CA            │  │  ──────────────────────────  │ │
│   │                                  │  │  This Week        $892.41   │ │
│   │  142 followers · 89 following    │  │  This Month     $2,847.22   │ │
│   │                                  │  │  All-Time      $12,492.87   │ │
│   │  [Follow] [Share Profile]        │  │                             │ │
│   └──────────────────────────────────┘  └─────────────────────────────┘ │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │  Achievements                                        View All →  │  │
│   │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │  │
│   │  │$1K  │ │WEEK │ │TOP  │ │NIGHT│ │ 🔒  │ │ 🔒  │               │  │
│   │  │CLUB │ │STRK │ │ 50  │ │ OWL │ │     │ │     │               │  │
│   │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘               │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │  Recent Sessions                                                 │  │
│   │  ────────────────────────────────────────────────────────────── │  │
│   │  [Session Post 1]                                                │  │
│   │  [Session Post 2]                                                │  │
│   │  [Session Post 3]                                                │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Urchie Mascot Usage

### Placement Guidelines

| Context | Urchie State | Size | Position |
|---------|--------------|------|----------|
| Logo lockup | Happy | 32px | Left of wordmark |
| Empty state | Sleepy or Determined | 120px | Center of empty area |
| Achievement unlocked | Celebrating | 64px | Above achievement card |
| Top 10 leaderboard | On Fire | 24px | Inline with rank badge |
| Error state | Sad | 80px | Center of error message |
| Onboarding | Happy | 96px | Guiding user through steps |

### Illustration Style

- **Linework:** 2px stroke, Charcoal (#141413)
- **Fill:** Soft gradients using Coral (#C6603F) → lighter coral
- **Eyes:** Large, expressive, slightly offset for personality
- **Spines:** Rounded tips, friendly not sharp
- **Expressions:** Achieved through eye shape, simple curved mouth, spine position

---

## Responsive Breakpoints

| Breakpoint | Width | Layout Adjustments |
|------------|-------|-------------------|
| Desktop | ≥1200px | Full layout, sidebar visible |
| Tablet | 768–1199px | Collapsed sidebar, stacked cards |
| Mobile | <768px | Single column, bottom nav, compact leaderboard |

### Mobile Leaderboard Adaptation

```
┌───────────────────────────────┐
│  #47  @username      $892.41  │
│        8.2M tokens   +4,521   │
├───────────────────────────────┤
│  #48  @nextuser      $847.22  │
│        7.8M tokens   +3,892   │
└───────────────────────────────┘
```

---

## Animation & Interaction

### Micro-interactions

| Element | Trigger | Animation |
|---------|---------|-----------|
| Rank badge | Rank improves | Scale 1.0 → 1.2 → 1.0, Coral pulse |
| Like button | Click | Heart fills with Coral, subtle bounce |
| Achievement | Unlock | Urchie celebration + confetti burst |
| Leaderboard row | Hover | Background fades to Coral 10% |
| Follow button | Click | Coral fill sweeps left to right |

### Transitions

- **Page transitions:** 200ms ease-out fade
- **Tab switches:** 150ms ease-in-out slide
- **Modal open/close:** 250ms ease-out scale + fade
- **Dropdown menus:** 150ms ease-out slide down

---

## Accessibility

### Color Contrast

All text combinations meet WCAG 2.1 AA standards:

| Combination | Contrast Ratio | Pass |
|-------------|----------------|------|
| Charcoal on Cream | 14.8:1 | ✓ AAA |
| Cream on Coral | 4.7:1 | ✓ AA |
| Warm Gray on Cream | 4.6:1 | ✓ AA |
| Coral on Cream | 4.5:1 | ✓ AA |

### Focus States

- Focus ring: 2px solid Slate Blue (#6A9BCC), 2px offset
- Skip-to-content link provided
- All interactive elements keyboard accessible

---

## Assets Checklist

### Design Tokens (export as JSON/CSS variables)
- [ ] Color palette
- [ ] Typography scale
- [ ] Spacing scale (4px base)
- [ ] Border radii
- [ ] Shadow definitions

### Components (Figma / code)
- [ ] Rank badge
- [ ] Leaderboard row (all states)
- [ ] Regional filter tabs
- [ ] Time period selector
- [ ] User card
- [ ] Session post
- [ ] Achievement badge
- [ ] Navigation bar
- [ ] Footer

### Urchie Illustrations
- [ ] Happy (default)
- [ ] Celebrating
- [ ] Determined
- [ ] Sleepy
- [ ] On Fire
- [ ] Sad (error state)
- [ ] Logo lockup version

### Icons
- [ ] Cost (dollar sign)
- [ ] Tokens
- [ ] Time/duration
- [ ] Lines added (+ arrow)
- [ ] Lines removed (- arrow)
- [ ] Like (heart)
- [ ] Comment (bubble)
- [ ] Share
- [ ] Settings
- [ ] Import