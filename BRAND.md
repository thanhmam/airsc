# Airsc brand and UI standards

The single source for how Airsc looks. Code follows this file; when the two disagree, fix one of them in the same change.

## Logo

Official files live in `public/brand/` (from the Airsc logo kit, see `public/brand/README.txt`).

| File | Use |
| --- | --- |
| `airsc-logo.svg` | Primary logo on light backgrounds |
| `airsc-logo-dark.svg` | Dark backgrounds: Violet 400 tile, "AI" cut out |
| `airsc-logo-mono-ink.svg` / `-mono-white.svg` | One colour; white only on Violet `#5A3DF0` |
| `airsc-logo-descriptor*.svg` | With the "AI RESOURCES" descriptor (press, partner pages) |
| `airsc-symbol*.svg` | Tile only: favicon and small sizes |
| `airsc-app-icon.svg` / `-512.png` | Full-bleed square with safe margin: app icon, round avatars |

In the app, never paste the SVG or draw the mark by hand. Use the component:

```tsx
import { Logo } from "@/components/brand/logo";

<Logo className="h-7 w-auto" />              // follows light/dark theme (header, footer)
<Logo symbol className="size-6" />          // tile only
<Logo tone="dark" style={{ height: 32 }} /> // always-dark surfaces (Remotion showcase)
```

Rules:

- Minimum size: logo 20px tall, symbol 16px.
- Clear space: half the tile height on every side.
- Don't recolour, stretch, outline, add shadows or set the wordmark in live text. The letters are outlined Geist SemiBold.
- Favicon `src/app/favicon.ico`, `src/app/icon.svg`, `src/app/apple-icon.png` and `src/app/manifest.ts` come from the kit. Replace them only with new kit exports.

## Colour

Brand colours (from the kit):

| Name | Hex | Role |
| --- | --- | --- |
| Violet | `#5A3DF0` | Accent on light: primary buttons, links, logo tile |
| Violet 400 | `#8F7BFF` | Accent on dark, and on always-dark panels |
| Ink | `#111113` | Text and the wordmark on light |
| Paper | `#FAFAF7` | Page background on light |

Always use the CSS tokens in `src/app/globals.css` (Tailwind: `bg-accent`, `text-muted`, `border-line`…), never raw hex in components. Each token has a light and a dark value (`prefers-color-scheme`).

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `bg` | `#fafaf7` | `#0b0b0d` | Page |
| `fg` | `#111113` | `#f1f1ee` | Text |
| `muted` | `#66666d` | `#9a9aa3` | Secondary text |
| `line` / `line-strong` | `#e6e5df` / `#d9d7cf` | `#25252b` / `#34343c` | Borders |
| `card` / `soft` / `art` | `#ffffff` / `#f1f0ea` / `#f4f2ec` | `#121215` / `#19191e` / `#17171c` | Surfaces, chips, illustration wells |
| `accent` / `accent-soft` / `accent-fg` | `#5a3df0` / `#ece8ff` / `#ffffff` | `#8f7bff` / `#221d3d` / `#0b0b0d` | Brand |
| `ink` / `sketch` | `#111113` / `#c9c7bf` | `#ecebe6` / `#3c3c45` | Illustration strokes and placeholder lines |
| `safe` / `caution` / `danger` (+ `-soft`) | green / amber / red | lighter on dark | Safety labels only |

Always-dark panels (Today's picks stage, Airsc MCP block, terminals) use `#0f0f14` with Violet 400 `#8f7bff` as their accent and `#4cc58a` for success, in both themes.

## Typography

- **Geist** for everything, **Geist Mono** for code, commands, counters and eyebrows. Both load in `src/app/[lang]/layout.tsx`.
- Headings: weight 600 (`font-semibold`), tight tracking. Hero `clamp(38px, 5.2vw, 68px)` at `-0.035em`; section titles 26px at `-0.02em`.
- Eyebrows: Geist Mono, 12px, uppercase, `tracking-[0.08em]`, accent colour.
- Body 16px / 1.5; secondary copy in `text-muted`. Use `text-balance` on headings and `text-pretty` on lead paragraphs.

## Layout and components

- Content width `max-w-6xl` with `px-4 sm:px-6`; sections `py-10`.
- Radius: cards 16px (`rounded-2xl`), inputs and buttons 12px (`rounded-xl`), chips fully rounded.
- Primary button: `bg-accent text-accent-fg`, hover `opacity-90`. Secondary: `border-line bg-card`.
- Cards lift on hover with the `.lift` class; illustrations animate only their violet detail (`.kv-*`, `.rv-*` in `globals.css`).
- Safety is always shown with `SafetyBadge` (or the same colours), never with the accent colour.
- Every animation has a `prefers-reduced-motion` fallback.
- All user-facing copy goes through `src/lib/i18n.ts` in both English and Vietnamese.
