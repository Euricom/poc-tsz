---
version: alpha
name: Euricom
description: 'Design system inspired by Euricom — bold, technology-forward dark UI with deep teal surfaces (#014046) and electric lime accents (#00FF00). Montserrat typography, high contrast, grid-forward composition, enterprise-grade polish with energetic CTAs.'
colors:
  primary: '#00FF00'
  secondary: '#014046'
  tertiary: '#DD23BB'
  neutral: '#062227'
  surface-muted: '#1D242C'
  background: '#014046'
  surface: '#014046'
  text-primary: '#FFFFFF'
  text-secondary: '#333333'
  text-on-accent: '#111519'
  text-muted: '#CBD9DA'
  border: '#CBD9DA'
  border-light: '#EEEEEE'
  accent-muted: '#114E0B'
  success: '#00FF00'
  success-soft: '#CEF5CA'
  error: '#3B0B0B'
  warning: '#F8E4E4'
typography:
  headline-display:
    fontFamily: Montserrat
    fontSize: 80px
    fontWeight: 700
    lineHeight: 88px
    letterSpacing: 0px
  headline-lg:
    fontFamily: Montserrat
    fontSize: 64px
    fontWeight: 700
    lineHeight: 76.8px
    letterSpacing: 0px
  headline-md:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: 400
    lineHeight: 76.8px
    letterSpacing: 0px
  headline-sm:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: 600
    lineHeight: 38.4px
    letterSpacing: 0px
  body-md:
    fontFamily: Montserrat
    fontSize: 19.2px
    fontWeight: 400
    lineHeight: 30.72px
    letterSpacing: 0px
  body-sm:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: 400
    lineHeight: 25.6px
    letterSpacing: 0px
  label-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: 500
    lineHeight: 25.6px
    letterSpacing: 0px
  button-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: 600
    lineHeight: 25.6px
    letterSpacing: 0px
  code-sm:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: 400
    lineHeight: 21px
    letterSpacing: 0px
rounded:
  none: 0px
  sm: 8px
  lg: 24px
  full: 9999px
spacing:
  base: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  2xl: 32px
  3xl: 40px
  4xl: 48px
  5xl: 64px
  6xl: 80px
  7xl: 96px
  8xl: 128px
  gutter: 20px
  container-max: 1440px
  content-max: 1280px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.text-on-accent}'
    typography: '{typography.button-md}'
    rounded: '{rounded.sm}'
    padding: 12px 32px
  button-secondary:
    backgroundColor: transparent
    textColor: '{colors.primary}'
    borderColor: '{colors.primary}'
    typography: '{typography.button-md}'
    rounded: '{rounded.sm}'
    padding: 12px 32px
  button-ghost:
    backgroundColor: transparent
    textColor: '{colors.text-primary}'
    borderColor: '{colors.text-primary}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.sm}'
    padding: 12px 24px
  card-featured:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text-primary}'
    typography: '{typography.body-md}'
    rounded: '{rounded.lg}'
    padding: 32px
  card-light:
    backgroundColor: '{colors.text-primary}'
    textColor: '{colors.text-on-accent}'
    typography: '{typography.body-md}'
    rounded: '{rounded.lg}'
    padding: 32px
  input-default:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text-primary}'
    typography: '{typography.body-md}'
    rounded: '{rounded.sm}'
    padding: 8px 16px
  nav-bar:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text-primary}'
    typography: '{typography.body-md}'
    padding: 16px 40px
---

# Design System Inspired by Euricom

## 1. Visual Theme & Atmosphere

Euricom's design system embodies a bold, technology-forward aesthetic rooted in deep teal and electric lime green. The visual language communicates innovation, precision, and forward-thinking expertise through high contrast, minimal ornamentation, and a sophisticated dark-mode foundation. The design leverages a grid-based backdrop with geometric accent elements to convey technical prowess and digital mastery. This system strikes a balance between corporate professionalism and cutting-edge tech energy, positioning Euricom as boundary-pushers in IT services. Bright neon green accents pop against dark, ocean-inspired backgrounds, creating visual tension that emphasizes energy and momentum. The overall aesthetic is premium, confident, and distinctly modern—designed to attract enterprise clients and demonstrate technical sophistication.

**Key Characteristics**

- Deep teal and dark navy foundation with electric lime green accents
- High contrast, light-on-dark typography for legibility and impact
- Minimal, geometric design language with grid-based patterns
- Premium feel achieved through generous whitespace and careful hierarchy
- Bold, contemporary color blocking with neon highlights
- Clean lines and rounded corners on contained elements (cards, inputs)
- Tech-forward aesthetic with subtle branding elements
- Enterprise-grade professionalism with creative energy

## 2. Color Palette & Roles

### Primary

- **Teal Dark** (`#014046`): Primary background and surface color for interactive elements, cards, and navigation. Dominant throughout the interface.
- **Teal Medium** (`#062227`): Secondary dark surface for layered depth and section differentiation.
- **Teal Light** (`#1D242C`): Tertiary dark shade for subtle contrast and component states.

### Accent Colors

- **Lime Green** (`#00FF00`): Primary accent and CTA indicator. Used for success states, active links, highlights, and primary button states. High visibility and energy.
- **Green Accent** (`#114E0B`): Muted secondary green for supporting accents and complementary emphasis.
- **Magenta** (`#DD23BB`): Tertiary accent for special highlights or alternative CTAs (used sparingly).

### Interactive

- **Lime Green** (`#00FF00`): Active states, hover highlights, focused elements, and primary call-to-action buttons.
- **Teal Dark** (`#014046`): Input field backgrounds and interactive component surfaces.

### Neutral Scale

- **White** (`#FFFFFF`): Primary text, content areas, and maximum contrast backgrounds.
- **Light Gray** (`#EEEEEE`): Secondary backgrounds and dividers.
- **Medium Gray** (`#CBD9DA`): Subtle borders and tertiary text.
- **Dark Gray** (`#333333`): Secondary text and reduced-emphasis elements.
- **Black** (`#000000`): Utility color for deep shadows or extreme contrast (minimal use).

### Surface & Borders

- **Teal Dark** (`#014046`): Primary card and container backgrounds with `24px` border radius.
- **Teal Medium** (`#062227`): Alternative surface for layering and visual separation.
- **White** (`#FFFFFF`): Light surface backgrounds and high-contrast cards (used in specific contexts).
- **Neutral Gray** (`#CBD9DA`): Subtle borders and dividers between sections.

### Semantic / Status

- **Success** (`#00FF00`): Confirmation states, active toggles, and positive feedback indicators.
- **Error** (`#3B0B0B`): Error backgrounds and warning states (dark red).
- **Warning** (`#F8E4E4`): Soft background for cautionary or informational contexts.
- **Success Light** (`#CEF5CA`): Softer success indicator for secondary contexts.

## 3. Typography Rules

### Font Family

**Primary:** Montserrat Variable Font with fallback stack: `Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
**Secondary:** Montserrat (all weights) for consistent brand voice.

### Hierarchy

| Role             | Font       | Size   | Weight | Line Height | Letter Spacing | Notes                                     |
| ---------------- | ---------- | ------ | ------ | ----------- | -------------- | ----------------------------------------- |
| Display / Hero   | Montserrat | 80px   | 700    | 88px        | 0px            | Largest heroic headlines for page titles  |
| Heading 1        | Montserrat | 64px   | 700    | 76.8px      | 0px            | Major section headings                    |
| Heading 2        | Montserrat | 48px   | 400    | 76.8px      | 0px            | Section subheadings and feature titles    |
| Heading 3        | Montserrat | 32px   | 600    | 38.4px      | 0px            | Subsection headings and card titles       |
| Body / Paragraph | Montserrat | 19.2px | 400    | 30.72px     | 0px            | Primary content and descriptive text      |
| Label / Caption  | Montserrat | 16px   | 500    | 25.6px      | 0px            | Form labels, captions, and auxiliary text |
| Link             | Montserrat | 19.2px | 400    | 30.72px     | 0px            | Hyperlinks (inherit body styling)         |
| Code             | Montserrat | 14px   | 400    | 21px        | 0px            | Code blocks and monospace content         |
| Button Text      | Montserrat | 16px   | 600    | 25.6px      | 0px            | CTA and interactive button labels         |

### Principles

- **Single typeface system:** Montserrat Variable Font across all roles ensures cohesive, modern aesthetic.
- **Weight contrast:** Leverage weights 400, 500, 600, and 700 to create visual hierarchy without font switches.
- **Generous line height:** All line heights exceed font size by 1.2–1.6× for improved readability and premium spacing.
- **White and light text on dark backgrounds:** Ensure WCAG AA contrast minimum of 4.5:1 for body text on teal (`#014046`).
- **Semantic sizing:** Display (80px), heading (64px), body (19.2px) create clear hierarchy without excessive steps.
- **Letter spacing:** Keep at 0px for all roles to maintain Montserrat's inherent letter forms and rhythm.

## 4. Component Stylings

### Buttons

#### Primary Button

- **Background:** `#00FF00` (Lime Green)
- **Text Color:** `#111519` (Near-black for contrast on bright background)
- **Font Size:** `16px`
- **Font Weight:** `600`
- **Line Height:** `25.6px`
- **Padding:** `12px 32px`
- **Border Radius:** `8px`
- **Border:** `2px solid #00FF00`
- **Box Shadow:** `none`
- **Hover State:** Background `#33FF33` (lighter green), border `#33FF33`, text remains `#111519`
- **Active State:** Background `#00DD00`, border `#00DD00`
- **Focus State:** Box shadow `0 0 0 3px rgba(0, 255, 0, 0.3)`

#### Secondary Button

- **Background:** `transparent`
- **Text Color:** `#00FF00` (Lime Green)
- **Font Size:** `16px`
- **Font Weight:** `600`
- **Line Height:** `25.6px`
- **Padding:** `12px 32px`
- **Border Radius:** `8px`
- **Border:** `2px solid #00FF00`
- **Box Shadow:** `none`
- **Hover State:** Background `rgba(0, 255, 0, 0.1)`, text remains `#00FF00`
- **Active State:** Background `rgba(0, 255, 0, 0.2)`
- **Focus State:** Box shadow `0 0 0 3px rgba(0, 255, 0, 0.3)`

#### Ghost Button

- **Background:** `transparent`
- **Text Color:** `#FFFFFF` (White)
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Line Height:** `25.6px`
- **Padding:** `12px 24px`
- **Border Radius:** `8px`
- **Border:** `1px solid #FFFFFF`
- **Box Shadow:** `none`
- **Hover State:** Background `rgba(255, 255, 255, 0.1)`, border `#00FF00`, text `#00FF00`
- **Active State:** Background `rgba(255, 255, 255, 0.2)`
- **Focus State:** Box shadow `0 0 0 3px rgba(255, 255, 255, 0.3)`

### Cards & Containers

#### Featured Card (with teal background)

- **Background:** `#014046` (Teal Dark)
- **Text Color:** `#FFFFFF` (White)
- **Font Size:** `19.2px`
- **Font Weight:** `400`
- **Line Height:** `30.72px`
- **Padding:** `32px`
- **Border Radius:** `24px`
- **Border:** `1px solid rgba(0, 255, 0, 0.2)` (subtle green border)
- **Box Shadow:** `0 8px 24px rgba(0, 0, 0, 0.3)`
- **Hover State:** Border `rgba(0, 255, 0, 0.4)`, box shadow `0 12px 32px rgba(0, 0, 0, 0.4)`

#### Light Card (with white/neutral background)

- **Background:** `#FFFFFF` (White)
- **Text Color:** `#111519` (Dark gray/near-black)
- **Font Size:** `19.2px`
- **Font Weight:** `400`
- **Line Height:** `30.72px`
- **Padding:** `32px`
- **Border Radius:** `24px`
- **Border:** `1px solid #CBD9DA` (light gray border)
- **Box Shadow:** `0 4px 12px rgba(0, 0, 0, 0.08)`
- **Hover State:** Box shadow `0 8px 20px rgba(0, 0, 0, 0.12)`

#### Case Study Container

- **Background:** `rgba(1, 64, 70, 0.4)` (Transparent teal)
- **Text Color:** `#FFFFFF` (White)
- **Font Size:** `19.2px`
- **Font Weight:** `400`
- **Line Height:** `30.72px`
- **Padding:** `48px`
- **Border Radius:** `24px`
- **Border:** `2px solid #00FF00` (lime green emphasis)
- **Box Shadow:** `0 8px 32px rgba(0, 255, 0, 0.15)`

### Inputs & Forms

#### Text Input (default)

- **Background:** `#014046` (Teal Dark)
- **Text Color:** `#FFFFFF` (White)
- **Font Size:** `19.2px`
- **Font Weight:** `400`
- **Line Height:** `27.4285px`
- **Padding:** `8px 16px`
- **Border Radius:** `8px`
- **Border:** `1px solid rgba(0, 255, 0, 0.3)` (subtle green border)
- **Height:** `48px`
- **Box Shadow:** `inset 0 1px 3px rgba(0, 0, 0, 0.2)`
- **Focus State:** Border `#00FF00`, box shadow `0 0 0 3px rgba(0, 255, 0, 0.2), inset 0 1px 3px rgba(0, 0, 0, 0.2)`
- **Placeholder Text:** `rgba(255, 255, 255, 0.5)`

#### Text Input (hover)

- **Background:** `#014046` (Teal Dark)
- **Border:** `1px solid rgba(0, 255, 0, 0.5)` (increased opacity)
- **Box Shadow:** `inset 0 1px 3px rgba(0, 0, 0, 0.3)`

#### Text Input (error)

- **Background:** `#014046` (Teal Dark)
- **Border:** `1px solid #DD23BB` (magenta for error)
- **Box Shadow:** `inset 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(221, 35, 187, 0.1)`

#### Text Input (disabled)

- **Background:** `rgba(1, 64, 70, 0.5)` (faded teal)
- **Text Color:** `rgba(255, 255, 255, 0.5)` (reduced opacity)
- **Border:** `1px solid rgba(0, 255, 0, 0.15)`
- **Cursor:** `not-allowed`

#### Label

- **Font Size:** `16px`
- **Font Weight:** `500`
- **Line Height:** `25.6px`
- **Color:** `#FFFFFF` (White)
- **Margin Bottom:** `8px`
- **Display:** `block`

### Navigation

#### Top Navigation Bar

- **Background:** `#014046` (Teal Dark)
- **Text Color:** `#FFFFFF` (White)
- **Font Size:** `19.2px`
- **Font Weight:** `400`
- **Line Height:** `30.72px`
- **Padding:** `16px 40px`
- **Height:** `80px`
- **Box Shadow:** `0 2px 8px rgba(0, 0, 0, 0.2)`
- **Border:** `none`

#### Navigation Link (default)

- **Text Color:** `#FFFFFF` (White)
- **Font Size:** `19.2px`
- **Font Weight:** `400`
- **Padding:** `8px 16px`
- **Border Radius:** `0px`
- **Text Decoration:** `none`
- **Transition:** `color 0.3s ease`

#### Navigation Link (hover)

- **Text Color:** `#00FF00` (Lime Green)
- **Background:** `rgba(0, 255, 0, 0.1)`

#### Navigation Link (active)

- **Text Color:** `#00FF00` (Lime Green)
- **Border Bottom:** `2px solid #00FF00`
- **Padding Bottom:** `6px`

### Badges

#### Success Badge

- **Background:** `rgba(0, 255, 0, 0.2)` (light green tint)
- **Text Color:** `#00FF00` (Lime Green)
- **Font Size:** `14px`
- **Font Weight:** `600`
- **Padding:** `6px 12px`
- **Border Radius:** `20px`
- **Border:** `1px solid #00FF00`

#### Info Badge

- **Background:** `rgba(1, 64, 70, 0.4)` (teal tint)
- **Text Color:** `#00FF00` (Lime Green)
- **Font Size:** `14px`
- **Font Weight:** `600`
- **Padding:** `6px 12px`
- **Border Radius:** `20px`
- **Border:** `1px solid #00FF00`

## 5. Layout Principles

### Spacing System

**Base Unit:** `8px`

**Spacing Scale with Contexts:**

- `8px`: Tight spacing within components, element-level gaps
- `12px`: Small gaps between inline elements, button padding vertical
- `16px`: Standard element padding, compact margins
- `20px`: Gap between related sections, form field spacing
- `24px`: Card and container padding, moderate section spacing
- `32px`: Prominent card padding, section-level gaps
- `40px`: Large container padding for visual breathing room
- `48px`: Major section padding, hero spacing
- `64px`: Featured section spacing, substantial whitespace
- `80px`: Hero section padding, full-height breaks
- `96px`: Large layout spacing between major content blocks
- `128px`: Maximum whitespace for visual separation and emphasis

**Application Contexts:**

- Component internal padding: `8px–24px`
- Container padding: `24px–64px`
- Section margins: `48px–128px` (vertical spacing between sections)
- Gap between card grids: `20px–32px`
- Button padding: `12px` (vertical) × `24px–32px` (horizontal)

### Grid & Container

- **Max Width Container:** `1440px` (full modern desktop width)
- **Grid Columns:** 12-column responsive grid
- **Column Gutter:** `20px` (gap between columns)
- **Card Grid:** 4 columns at full width, cards at `~340px` width
- **Semantic Sections:** Full-width sections with max-width padding container inside
- **Content Width:** `1280px` for dense content, `1440px` for spacious layouts

### Whitespace Philosophy

Euricom's design embraces generous whitespace as a premium design signal. Sections are separated by substantial vertical gaps (`64px–128px`), creating visual breathing room and preventing content fatigue. Internal component spacing is deliberate and measured, with padding scales reflecting the component's hierarchy. Whitespace is not empty space but an active design decision that communicates sophistication, clarity, and focused intent. The dark teal background acts as a visual container, with white and light gray text emerging with intentional emphasis.

### Border Radius Scale

- **`0px`:** Buttons with sharp edges (sparingly used), full-width elements, grids
- **`8px`:** Input fields, small buttons, subtle component corners
- **`24px`:** Cards, large containers, featured elements, case study cards
- **`50%`:** Avatar circles, badge pills, fully rounded interactive elements

## 6. Depth & Elevation

| Level                 | Treatment                        | Use                                      |
| --------------------- | -------------------------------- | ---------------------------------------- |
| Flat (0)              | No shadow                        | Form fields, minimal-emphasis elements   |
| Subtle (1)            | `0 2px 8px rgba(0, 0, 0, 0.2)`   | Navigation bar, borders only             |
| Base (2)              | `0 4px 12px rgba(0, 0, 0, 0.15)` | Light cards, secondary containers        |
| Raised (3)            | `0 8px 24px rgba(0, 0, 0, 0.3)`  | Featured cards, interactive hover states |
| Elevated (4)          | `0 12px 32px rgba(0, 0, 0, 0.4)` | Modals, overlays, highest emphasis       |
| Accent Glow (special) | `0 0 12px rgba(0, 255, 0, 0.3)`  | Lime green highlights, active CTAs       |

**Shadow Philosophy:**
Shadows are minimal and intentional, serving to separate layered components rather than create dramatic depth. The dark teal background naturally recedes, while white text and lime green accents advance. Shadows increase subtly on hover to signal interactivity. The signature accent glow—a soft lime green outer shadow—appears on primary CTAs and active states, reinforcing the brand's energy and guiding user focus.

## 7. Do's and Don'ts

### Do

- **Use lime green (`#00FF00`) intentionally:** Reserve bright green for primary actions, active states, and critical feedback. Apply with restraint to maintain visual impact.
- **Maintain dark teal backgrounds:** Keep `#014046` as the dominant container color for cohesion and recognition. Vary with `#062227` for subtle layering only when necessary.
- **Leverage generous padding:** Apply minimum `24px` padding to cards and `32px–48px` to sections for premium spacing. Avoid cramped, dense layouts.
- **Use white text on dark backgrounds:** Ensure readability and high contrast. White (`#FFFFFF`) is your primary text color on teal.
- **Apply border radius consistently:** Use `24px` for all primary cards and containers, `8px` for inputs and small components.
- **Create hierarchy with typography weight:** Use weight 700 for headlines, 600 for subheadings, 500 for labels, 400 for body.
- **Incorporate the grid pattern subtly:** Use faint grid overlays or borders in the background to reinforce the tech-forward aesthetic without overwhelming content.
- **Test interactive states thoroughly:** Ensure hover, focus, active, and disabled states are distinct and accessible (minimum 4.5:1 contrast ratio).

### Don't

- **Avoid overuse of accent colors:** Don't apply lime green to every element. Reserve it for CTAs, active states, and key highlights only.
- **Don't mix too many neutral shades:** Stick to white (`#FFFFFF`), light gray (`#EEEEEE`), and medium gray (`#CBD9DA`). Avoid introducing additional gray variations.
- **Never reduce line height below content readability:** Maintain 1.2–1.6× multipliers on all text. Avoid tight line-height (`1.0` or less) on body text.
- **Don't flatten hierarchy by using inconsistent font sizes:** Adhere strictly to the typography table. Avoid arbitrary size choices outside the defined scale.
- **Avoid thin borders or outlines:** Use minimum `1px` borders. Prefer `2px` for emphasis. Don't use hairline (`0.5px`) borders on interactive elements.
- **Don't apply shadows excessively:** Shadows should lift elements, not darken or muddy the interface. Reserve elevated shadows for truly layered components.
- **Never disable visual feedback:** Always provide clear hover, focus, and active states. Don't remove outline or underline from interactive elements without replacement affordance.
- **Avoid bright colors beyond lime green:** Don't introduce additional vibrant hues. Magenta (`#DD23BB`) and red (`#3B0B0B`) are emergency states only; use sparingly.

## 8. Responsive Behavior

### Breakpoints

| Breakpoint Name | Width           | Key Changes                                                                     |
| --------------- | --------------- | ------------------------------------------------------------------------------- |
| Mobile          | `320px–599px`   | Single-column layout, `16px` padding, `14px` heading text, full-width cards     |
| Tablet          | `600px–1023px`  | 2-column grid, `24px` padding, `32px` headings, `80px` section spacing          |
| Desktop         | `1024px–1439px` | 3–4 column grid, `40px` padding, `64px` headings, max-width `1280px`            |
| Large Desktop   | `1440px+`       | 4-column grid, `48px–64px` padding, full `1440px` width, `80px` section spacing |

**Responsive Text Scaling:**

- **H1 (Display):** `80px` (desktop) → `48px` (tablet) → `32px` (mobile)
- **H2:** `64px` (desktop) → `40px` (tablet) → `28px` (mobile)
- **H3:** `32px` (desktop) → `24px` (tablet) → `20px` (mobile)
- **Body:** `19.2px` (desktop) → `16px` (tablet) → `16px` (mobile)

### Touch Targets

- **Minimum Size:** `48px × 48px` (buttons, interactive elements)
- **Recommended Padding:** `12px` vertical, `24px` horizontal for buttons
- **Spacing Between Targets:** Minimum `16px` gap to prevent accidental activation
- **Link Underlines:** Ensure visible on mobile (font-weight increase or color change)
- **Hover States on Mobile:** Replace with highlight or press state (background color change)

### Collapsing Strategy

**Mobile (320px–599px):**

- Stack all cards and sections vertically (single column)
- Reduce padding to `16px` for containers
- Hide secondary navigation in hamburger menu
- Collapse multi-column grids to single column
- Increase font sizes slightly for readability on small screens
- Full-width buttons and inputs
- Reduce `80px` hero padding to `48px`

**Tablet (600px–1023px):**

- Switch to 2-column grid layout
- Increase padding to `24px`
- Show primary navigation inline; secondary in menu
- Reduce heading sizes slightly (`-10%`)
- Cards scale to `~50%` width with gutter
- Section padding: `64px` vertical

**Desktop (1024px+):**

- Activate full multi-column layouts (3–4 columns)
- Restore full heading sizes
- Standard padding and margins apply
- Show all navigation elements
- Use max-width containers for breathing room

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA / Active:** Lime Green (`#00FF00`)
- **Primary Background / Container:** Teal Dark (`#014046`)
- **Secondary Background / Layering:** Teal Medium (`#062227`)
- **Text / Foreground:** White (`#FFFFFF`)
- **Secondary Text:** Dark Gray (`#333333`)
- **Borders / Dividers:** Medium Gray (`#CBD9DA`)
- **Success / Positive Feedback:** Lime Green (`#00FF00`)
- **Error / Warning:** Magenta (`#DD23BB`) or Dark Red (`#3B0B0B`)
- **Neutral / Disabled:** Light Gray (`#EEEEEE`)

### Iteration Guide

1. **Start with dark teal (`#014046`):** All primary containers, cards, and surface areas default to this color. This is your foundational brand color.

2. **Apply lime green (`#00FF00`) to interactive elements only:** Primary buttons, active link states, focus indicators, and success feedback. Never use green for static text or backgrounds.

3. **Use white text (`#FFFFFF`) on all dark backgrounds:** Ensure minimum 4.5:1 contrast for accessibility. Dark gray (`#333333`) only for light backgrounds.

4. **Maintain consistent border radius:** `24px` for cards and major containers, `8px` for inputs and small components. No variation without explicit justification.

5. **Apply generous padding systematically:** Base unit is `8px`. Scale by multiples: `8px` (tight), `16px` (compact), `24px` (standard), `32px` (spacious), `48px` (heroic).

6. **Use only Montserrat Variable Font:** No serif fonts. Stick to weights 400, 500, 600, 700 for hierarchy.

7. **Establish shadow depth deliberately:** Flat elements (forms) have no shadow. Base cards have `0 4px 12px rgba(0, 0, 0, 0.15)`. Featured cards have `0 8px 24px rgba(0, 0, 0, 0.3)`. Accent glow on hover: `0 0 12px rgba(0, 255, 0, 0.3)`.

8. **Implement responsive scaling:** Desktop headings → tablet (–10–15%) → mobile (–30–40%). Use breakpoints: 320px, 600px, 1024px, 1440px.

9. **Provide clear interaction states:** Every button, link, and input must have default, hover, active, and focus states. Focus states include a visible ring or color change (minimum `3px` outline).

10. **Test contrast and accessibility:** Verify all text meets WCAG AA (4.5:1 minimum). Ensure interactive elements are at least `48px × 48px` with `16px` minimum spacing between targets.
