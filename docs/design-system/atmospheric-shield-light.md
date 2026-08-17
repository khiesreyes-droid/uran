---
name: Atmospheric Shield Light
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#424656'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737687'
  outline-variant: '#c2c6d9'
  surface-tint: '#0053da'
  primary: '#004cca'
  on-primary: '#ffffff'
  primary-container: '#0062ff'
  on-primary-container: '#f3f3ff'
  inverse-primary: '#b4c5ff'
  secondary: '#00677f'
  on-secondary: '#ffffff'
  secondary-container: '#00ccf9'
  on-secondary-container: '#005266'
  tertiary: '#48586d'
  on-tertiary: '#ffffff'
  tertiary-container: '#607087'
  on-tertiary-container: '#eef3ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#b7eaff'
  secondary-fixed-dim: '#4cd6ff'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e60'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 16px
---

## Brand & Style

The brand personality for the design system is focused on precision, security, and high-tech clarity. It targets a professional audience in sectors like cybersecurity, aerospace, and data infrastructure—users who require high information density without cognitive overload.

The design style is **Modern Tech with Glassmorphic accents**. It transitions the original "Atmospheric Shield" narrative from a dark, brooding command center into a bright, "clean-room" laboratory environment. We utilize heavy whitespace to suggest an expansive, open atmosphere while maintaining a futuristic edge through subtle translucency, vibrant blue highlights, and a structured, systematic layout. The emotional response should be one of calm control and unwavering reliability.

## Colors

The palette is built on a foundation of "Atmospheric Whites" and "Stratus Greys."
- **Primary (#0062FF):** A vibrant, high-contrast blue used for critical actions and primary brand touchpoints. It ensures WCAG AA compliance against white backgrounds.
- **Secondary (#00D1FF):** A bright cyan used for data visualization and secondary status indicators, suggesting energy and movement.
- **Neutrals:** We utilize a refined scale of cool greys (Slate 50 to Slate 900). The base surface is `#FFFFFF`, while background layers use `#F8FAFC`.
- **Accents:** Success states use a crisp emerald; alerts use a high-visibility amber. All interactive elements must maintain a 4.5:1 contrast ratio against their respective containers.

## Typography

This design system employs a tiered typographic strategy to balance technical precision with readability.
- **Geist** is used for headlines to provide a sharp, developer-friendly aesthetic that feels engineered.
- **Inter** handles the bulk of body text, chosen for its exceptional legibility in data-dense light-mode interfaces.
- **JetBrains Mono** is reserved for labels, metadata, and status readouts, reinforcing the high-tech "Shield" narrative.

All display type uses tighter letter spacing to maintain a cohesive visual block, while labels use increased tracking for better scanability at small sizes.

## Layout & Spacing

The layout follows a **Fluid Grid** model based on a 4px baseline shift. 
- **Desktop:** A 12-column grid with 24px gutters. Content is capped at a 1440px max-width to prevent line-length fatigue.
- **Mobile:** A 4-column grid with 16px gutters and margins. 

Spacing is used to create "zones" of protection. Use generous outer padding (32px+) for primary containers to simulate an airy, atmospheric feel, while internal component spacing remains tight (8px-12px) to maintain a sense of technical efficiency.

## Elevation & Depth

To adapt the "Atmospheric" feel for light mode, we move away from heavy shadows toward **Glassmorphism and Tonal Layering**.

1.  **Base Layer:** `#F8FAFC` (The void).
2.  **Surface Layer:** `#FFFFFF` with a 1px border in `#E2E8F0`.
3.  **Glass Layer:** Used for navigation bars and floating panels. Apply a `backdrop-filter: blur(12px)` with a background of `rgba(255, 255, 255, 0.7)`.
4.  **Shadows:** Use "Ambient Shadows"—extremely soft, low-opacity (4-8%) blurs with a slight blue tint (`#0062FF` at 5% opacity) to suggest the surface is hovering within a pressurized environment.

## Shapes

The design system uses a **Soft** shape language. This avoids the friendliness of overly rounded "pill" shapes, opting instead for a precision-engineered look. 
- **Standard components** (Buttons, Inputs): 0.25rem (4px) corner radius.
- **Cards and Containers**: 0.5rem (8px) corner radius.
- **Outer Shells**: 0.75rem (12px) corner radius.

This subtle rounding mimics the look of machined aerospace parts—functional and safe, yet strictly geometric.

## Components

- **Buttons:** Primary buttons use a solid `#0062FF` fill with white text. Secondary buttons use a transparent background with a 1px `#E2E8F0` border and `#0062FF` text. High-tech "Ghost" buttons utilize JetBrains Mono for the label.
- **Inputs:** Fields should have a subtle `#F1F5F9` background and a 1px bottom-border only in their default state, transitioning to a full `#0062FF` stroke on focus to simulate a "scanning" effect.
- **Chips:** Used for status. They should feature a low-opacity background tint of the status color (e.g., 10% Blue) with high-contrast text and a leading 6px "dot" icon.
- **Cards:** White surfaces with a very fine 1px border. On hover, cards should lift slightly using the blue-tinted ambient shadow defined in the Elevation section.
- **Data Tables:** High-density, utilizing Arimo or Inter for numerical data. Rows alternate with a `#F8FAFC` zebra stripe for tracking across large screens.
- **Glass Overlays:** Modals and dropdowns must use the glassmorphic blur effect to maintain visual context of the "Shield" background behind them.
