# Straude Design System (Reference Alignment)

## Visual Direction
Brutalist editorial UI: high contrast, sharp edges, heavy borders, and confident typography. Layouts should feel like printed dashboards—grid‑driven, bold, and slightly industrial. Avoid soft gradients, rounded cards, or delicate shadows unless explicitly called out in the references.

## Color Palette
- **Ink / Black**: `#000000` (primary text, borders)
- **White**: `#FFFFFF` (base background)
- **Accent Orange**: `#FF4D00` (primary CTAs, highlights)
- **Accent Purple**: `#5A35B6` (secondary accent, focus)
- **Accent Pink**: `#D8006E` (side accent bar, active tabs)
- **Beige**: `#E6E1D8` (mobile backgrounds)
- **Sand**: `#F5F5F5` (hover fills, subtle panels)
- **Gray**: `#666666` (secondary text)

Use strong black borders for structure. Accent colors should be used sparingly and intentionally.

## Typography
- **Display**: Archivo (uppercase, tight tracking)
- **Body**: IBM Plex Sans (neutral, readable)
- **Mono**: JetBrains Mono (metrics + code)

Preferred utility classes:
- `type-display` and `type-display-condensed` for headlines
- `type-mono-look` for labels, meta, and microcopy
- `font-body` for longer text

## Layout & Structure
- **Desktop**: 320px sidebar + main content grid, full‑bleed header, 1–2px black borders.
- **Mobile**: orange header bar, beige background, and a tab strip that feels like printed tabs.
- **Side Accent**: a thin pink bar on the right edge reinforces the brand.

## Core Components
- **Buttons**: `.btn-brutal` with square edges. Primary is black → orange on hover; secondary is outlined.
- **Inputs**: `.input-brutal` with black border and purple focus ring.
- **Panels**: `.panel-brutal` for static sections (profile header, onboarding card).
- **Cards**: `.card-brutal` (border + offset shadow) for empty states and callouts.
- **Feed Rows**: dense list rows with black dividers and mono timestamps.
- **Import Area**: dotted background with a lifted `.import-box` shadow.

## Interaction
Hover states should be immediate and graphic (sand fills, underline, or bold color swap). Avoid soft fades or gradients unless present in the references.
