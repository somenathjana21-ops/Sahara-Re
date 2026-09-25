---
name: Compassionate Support System
colors:
  surface: '#f6faff'
  surface-dim: '#d6dae0'
  surface-bright: '#f6faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f4fa'
  surface-container: '#eaeef4'
  surface-container-high: '#e4e9ee'
  surface-container-highest: '#dee3e8'
  on-surface: '#171c20'
  on-surface-variant: '#404942'
  inverse-surface: '#2c3135'
  inverse-on-surface: '#edf1f7'
  outline: '#707972'
  outline-variant: '#bfc9c0'
  surface-tint: '#2a6a48'
  primary: '#206140'
  on-primary: '#ffffff'
  primary-container: '#3b7a57'
  on-primary-container: '#c5ffd8'
  inverse-primary: '#93d5ac'
  secondary: '#516071'
  on-secondary: '#ffffff'
  secondary-container: '#d4e4f9'
  on-secondary-container: '#576677'
  tertiary: '#8e3d22'
  on-tertiary: '#ffffff'
  tertiary-container: '#ac5437'
  on-tertiary-container: '#ffeee9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aff1c6'
  primary-fixed-dim: '#93d5ac'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#0a5132'
  secondary-fixed: '#d4e4f9'
  secondary-fixed-dim: '#b8c8dc'
  on-secondary-fixed: '#0d1d2c'
  on-secondary-fixed-variant: '#394859'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59e'
  on-tertiary-fixed: '#390b00'
  on-tertiary-fixed-variant: '#7a2f15'
  background: '#f6faff'
  on-background: '#171c20'
  surface-variant: '#dee3e8'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '600'
    lineHeight: 52px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: 0em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The design system establishes a sanctuary of calm, reassurance, and absolute clarity for individuals experiencing intense emotional distress, crisis, or seeking community mental health resources. The audience includes people in vulnerable emotional states, support workers, and family members needing immediate, frictionless help. 

The aesthetic is a union of Soft Minimalism and Humanist Functionalism. Every visual decision prioritizes emotional de-escalation:
- **Zero Sensory Overload**: Strictly avoids aggressive animations, jarring saturated alerts, dense clusters of text, or jarring drop shadows.
- **Immediate Path to Relief**: Instant visibility for critical contact methods (call, text, chat, quick-exit safety tools) without cognitive strain.
- **Gentle Reassurance**: Generous negative space, organic soft rounded surfaces, and grounding earthy undertones communicate dignity, trust, and human presence.

## Colors
The color palette uses therapeutic, earth-rooted hues calibrated for WCAG 2.1 AAA contrast compliance against light grounding surfaces:

- **Primary (`#3B7A57` - Deep Sage Green)**: Conveys organic stability, healing, and peace. Used for primary reassuring actions, active highlights, and trusted confirmations. Paired with soft tint backgrounds (`#E8F0EC`) to offer gentle, non-threatening visual anchor points.
- **Secondary (`#2B3A4A` - Deep Slate Navy)**: Conveys authority, safety, and steadfast reliability. Used for primary typography, structural icons, and grounded header elements.
- **Tertiary (`#D97757` - Terracotta Rose)**: A warm, humane alert tone used strictly when urgent action or discrete quick-exit safety options require distinct separation without resorting to panic-inducing pure reds.
- **Neutral & Canvas (`#F8F9FA`, `#F1F3F5`, `#71767B`)**: A layered, warm stone and soft slate foundation that prevents harsh ocular glare typical of stark pure-white screens, softening reading fatigue.

## Typography
Plus Jakarta Sans is utilized across all typography levels for its friendly, human-centric geometry, open apertures, and exceptional legibility during heightened cognitive stress.

Typographic hierarchy rules:
- **Pacing & Breathing Room**: Paragraph line heights remain relaxed (`1.6` to `1.65`) to prevent lines from visually blurring together for an anxious reader.
- **Line Length Constraints**: Body copy containers should never exceed 64 characters per line (`max-w-prose` / ~640px) to prevent scanning exhaustion.
- **Weight Restraint**: Restrict weight usage strictly to `Regular (400)`, `Medium (500)`, and `SemiBold (600)`. Avoid heavy, intimidating weights or thin, spindly display weights.

## Layout & Spacing
The layout model employs a centered, fluid 12-column grid constrained to a maximum content width of 1140px, prioritizing calm visual cohesion over edge-to-edge content saturation:

- **Desktop (1024px+)**: 12 columns, 24px (`1.5rem`) gutters, 32px to 48px outer canvas margins. Generous section-to-section padding of `4rem` to `6rem` isolates distinct concepts and eliminates cognitive clutter.
- **Tablet (768px - 1023px)**: 8 columns, 20px gutters, 24px margins. Content reflows into single or dual cards.
- **Mobile (320px - 767px)**: 4 columns, 16px (`1rem`) gutters, 16px margins. Primary contact triggers (Call / Text / Chat) pin persistently or sit above the fold with full-width clarity.
- **Rhythm**: Spacing follows a predictable 8pt structural rhythm. Inner container padding strictly aligns to `space-md` (`16px`) and `space-lg` (`24px`).

## Elevation & Depth
Depth is created through gentle tonal layering and low-contrast surface boundaries rather than heavy, artificial drop shadows:

- **Surface Tiers**:
  - **Base Canvas**: Soft stone tint (`#F8F9FA`).
  - **Surface Container (Level 1)**: Pure white (`#FFFFFF`) or pale slate/stone (`#F1F3F5`) with a 1px border of soft tone (`#E2E6E9`).
  - **Active / Accent Container (Level 2)**: Soft sage wash (`#E8F0EC`) bordered with `#C8DBD1`.
- **Shadow Profiles**:
  - Elements rely on an ultra-diffused, ambient shadow: `0 4px 20px -2px rgba(43, 58, 74, 0.04)`.
  - Floating emergency bars or overlays use: `0 8px 30px -4px rgba(43, 58, 74, 0.08)`.
- **Low-Stimulus Boundaries**: Hard lines and high-contrast borders are avoided; subtle boundaries allow cards to separate peacefully from the background canvas without visual vibration.

## Shapes
A roundedness value of 2 defines soft, welcoming curves across all interface geometry (`0.5rem` base, `1rem` on cards and dialogs, `1.5rem` on prominent emergency banner elements). 

Interactive elements such as Quick Exit buttons and Live Helpline pills adopt fully pill-shaped radii to reinforce softness, touch safety, and approachable physical interaction. No element maintains sharp, 90-degree corners.

## Components

### Action & Emergency Buttons
- **Crisis Direct Action (Call / Text / Chat)**: Minimum touch target of 56px in height. Background `#3B7A57` with white text, paired with prominent icons (phone, message bubble). States transition smoothly (200ms ease) to `#316447` on hover/focus without abrupt color jumps.
- **Quick Exit Button**: Positioned fixed or top-right anchored. High-visibility tertiary terracotta background tint (`#FDF1EC`), bold text `#B24E31`, and 1px border `#F2D0C5`. Features an instant keyboard shortcut trigger (`ESC`) and immediate browser history redirection.
- **Secondary Actions**: White surface, 1.5px `#2B3A4A` stroke, text in `#2B3A4A`. Clear focus rings in sage green (`3px solid rgba(59, 122, 87, 0.35)`).

### Cards & Help Tiers
- **Service Cards**: Flat white background, 1rem (`16px`) corner radius, subtle 1px border (`#E2E6E9`), 24px internal padding. Content is structured with clear visual hierarchy: icon, short calming title, concise plain-language explanation, and one single primary text-link action.
- **Crisis Callout Card**: Soft sage container (`#E8F0EC`) with 1rem roundedness, containing a direct, reassuring statement ("Free. Confidential. 24/7.") and large tap-to-call numbers.

### Trust Badges & Endorsements
- Rounded pill containers (`rounded-full`) with a gentle tint (`#F1F3F5`), slate text (`#2B3A4A`), and subtle shield/check icons. Conveys immediate verification (e.g., "100% Confidential", "Accredited Crisis Specialists", "No Data Retained").

### Form Fields & Inputs
- Inputs feature 48px height, rounded corners (`0.5rem`), light background (`#FFFFFF`), and a soft border (`#D0D7DE`). 
- Focus states utilize a calming sage ring (`rgba(59, 122, 87, 0.4)`) with zero red borders unless an explicit error must be communicated with gentle, supportive guiding text.

### Checkboxes & Radios
- Size 20x20px with smooth `0.25rem` corners for checkboxes and fully circular for radios. Selected state fills with `#3B7A57` displaying an explicit white checkmark. Focus states maintain an accessible 2px offset ring.