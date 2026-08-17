---
name: Atmospheric Shield
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d2027'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2ec'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#b9c8de'
  on-secondary: '#233143'
  secondary-container: '#39485a'
  on-secondary-container: '#a7b6cc'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#d4e4fa'
  secondary-fixed-dim: '#b9c8de'
  on-secondary-fixed: '#0d1c2d'
  on-secondary-fixed-variant: '#39485a'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353c'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style
The brand personality is protective, intelligent, and vigilant. It targets homeowners and tech-savvy individuals who value garment care and home automation. The UI must evoke a sense of "technological calm"—the feeling that a sophisticated system is silently and effectively managing environmental risks.

The design style is a hybrid of **Modern Corporate** and **Glassmorphism**. It utilizes a deep, immersive dark mode to represent the "internal" security of the home, while employing translucent, frosted-glass layers to represent the "external" atmosphere and weather conditions. High-tech accents via thin-line iconography and subtle glows reinforce the IoT nature of the product.

## Colors
This design system utilizes a high-contrast dark palette to ensure readability in various lighting conditions. 

- **Protection Blue (#3B82F6):** Used for active protection states, primary actions, and connectivity indicators.
- **Sunny Amber (#F59E0B):** Reserved for UV warnings and high-heat alerts.
- **Cloud Gray (#94A3B8):** Used for secondary text, inactive sensor states, and decorative borders.
- **Success Green (#10B981):** Signals a "Safe" or "Dry" status.
- **Warning Red (#EF4444):** Immediate rain alerts or mechanical system failures.

Surfaces use a tiered dark-slate system to create a sense of depth without relying on pure blacks, maintaining a premium, "midnight" tech aesthetic.

## Typography
Inter is the sole typeface for this design system to ensure maximum technical clarity and a systematic feel. 

- **Headlines:** Use Bold (700) weights with slight negative letter-spacing to feel tight and authoritative. 
- **Status Updates:** The `display-lg` role is used for primary data points like humidity percentages or temperature.
- **Labels:** Use `label-caps` for sensor categories (e.g., "HUMIDITY", "UV INDEX") to differentiate them from interactive UI text.
- **Scalability:** On mobile, large display type should scale down to prevent awkward wrapping, ensuring the critical "Safe/Unsafe" status is always visible above the fold.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for mobile handsets. A 4-column grid is used for mobile views, with a standard 20px margin on the outer edges of the screen.

- **Rhythm:** All spacing is based on a 4px baseline. Components are typically separated by `lg` (24px) vertical spacing.
- **Grouping:** Related sensor data should be grouped in cards with `md` (16px) internal padding.
- **Safe Areas:** Ensure interactive toggles and critical alerts stay within the thumb-zone (bottom 2/3 of the screen).

## Elevation & Depth
Depth is achieved through a combination of **Tonal Layering** and **Glassmorphism**.

- **Level 0 (Background):** Deep Slate (#0F172A).
- **Level 1 (Cards):** Surface Slate (#1E293B) with a subtle 1px border of #94A3B8 at 10% opacity.
- **Level 2 (Active/Floating):** Glassmorphic panels. Use a background blur of 12px-16px and a semi-transparent fill of the primary color (#3B82F6 at 15%).
- **Shadows:** Avoid heavy black shadows. Instead, use colored glows (e.g., a subtle 20px blur of #3B82F6 at 20% opacity) behind active status gauges to simulate light emitting from the hardware sensors.

## Shapes
The design system uses a very high degree of roundedness to feel modern and accessible.

- **Standard Cards:** Use `rounded-xl` (1.5rem / 24px) to create a soft, protective feel.
- **Buttons & Toggles:** Use `rounded-lg` (1rem / 16px).
- **Status Indicators:** Gauges and progress rings are perfectly circular to represent continuous monitoring.
- **Icons:** Use thin-line (1.5px stroke) icons with slightly rounded caps and corners to match the UI's geometry.

## Components
- **Status Rings:** Large, center-aligned gauges for "Humidity" or "Rain Probability." The ring should use a primary blue gradient. When a threshold is crossed, the ring color transitions to Warning Red.
- **Glass Cards:** Used for secondary sensor data (Wind Speed, UV). They feature a translucent background with white text and thin-line icons.
- **Automation Toggles:** Large, tactile switches. The "On" state should have a subtle outer glow of Protection Blue.
- **Interactive Charts:** Line graphs using a smoothed (spline) curve. The area under the line should have a vertical gradient fading from Protection Blue to transparent.
- **Notification Badges:** Small, high-contrast circles (#EF4444) placed on the top-right of the "Alerts" icon. Use a white 2px stroke around the badge to separate it from the dark background.
- **Buttons:** Primary buttons use a linear gradient from #3B82F6 to #2563EB. Secondary buttons are "Ghost" style with a Cloud Gray border.