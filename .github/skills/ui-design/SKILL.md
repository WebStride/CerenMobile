---
name: ui-design
description: Universal UI design skill covering visual hierarchy, typography, color systems, spacing, component styling, and animation. Reads design.md for brand tokens. Recommends animation libraries. Asks for Cloudinary path for video/motion assets on landing pages. Apply when styling components, building design systems, or refining visual quality.
applyTo: ["**/*.css", "**/*.scss", "**/*.tsx", "**/*.jsx", "**/*.md"]
teamRole: Design
relatedSkills:
  - ux-design
  - design-systems
  - accessibility-design
  - interaction-design
  - frontend-engineer
expertise:
  - visual-hierarchy
  - typography
  - color-theory
  - spacing-systems
  - component-styling
  - animation-design
---

# UI Design Skill

## Activation

**Step 1:** Read `.github/design.md` immediately. Extract: primary/secondary colors, typography scale, spacing tokens, border-radius system, shadow system, component library in use.

**Step 2:** If the task involves a landing page, hero section, or marketing-facing page — ask:
> "Do you have a Cloudinary account with brand videos or motion assets? If so, share the Cloudinary base URL or folder path so I can reference assets properly."

**Step 3:** If the task involves animations or transitions, recommend the appropriate animation library based on the project stack (see Animation Libraries section below).

---

## Role Overview

UI Designers own the visual layer of the product. They translate UX wireframes into polished, pixel-precise, brand-consistent interfaces using the design system. They define how the product looks AND feels through intentional use of color, space, type, and motion.

---

## Core Responsibilities

- Apply brand tokens consistently across all components
- Define visual hierarchy through typography, color, and spacing
- Design component states: default, hover, active, focus, disabled, error
- Specify animation and transition properties
- Produce Figma designs at production fidelity
- Maintain and evolve the design system

---

## Visual Design Foundations

### Typography
- Use a type scale (e.g., 12/14/16/18/20/24/32/48px) — never arbitrary sizes
- Limit to 2 typefaces: one for headings, one for body
- Line height: 1.4–1.6 for body, 1.1–1.3 for headings
- Letter spacing: tighten headings (-0.02em), loosen uppercase labels (+0.05em)
- Max line length: 60–80 characters for body copy

### Color System
- Define primary, secondary, accent, neutral, semantic (success/warning/error/info)
- Always use color tokens (CSS variables or Tailwind config) — never hardcode hex
- Contrast ratios: AA minimum (4.5:1 body, 3:1 large text), AAA preferred
- Never convey information with color alone — always pair with icon or label
- Dark mode: define semantic tokens that invert, not full redesigns

### Spacing System
- Use a base-4 or base-8 scale: 4/8/12/16/20/24/32/40/48/64/80/96px
- Never use arbitrary spacing — always reference the scale
- Consistent padding within component families

### Elevation & Depth
- 3–5 shadow levels: card, dropdown, modal, tooltip, sticky header
- Use blur + spread + opacity combinations from design.md tokens
- Avoid harsh drop shadows — use soft, diffused shadows

---

## Component States

Every interactive component requires all states designed:

| State | Required For |
|-------|-------------|
| Default | All components |
| Hover | Buttons, links, cards, table rows |
| Active/Pressed | Buttons, toggles |
| Focus | All interactive elements (keyboard nav) |
| Disabled | Buttons, inputs, selects |
| Loading | Buttons, form submission, data fetching |
| Error | Inputs, forms, API failures |
| Empty | Lists, tables, dashboards |
| Success | Form submission, actions |

---

## Animation Libraries (by Stack)

When animations are needed, recommend based on project stack:

| Stack | Recommended Library | Best For |
|-------|--------------------|---------| 
| React/Next.js | **Framer Motion** | Page transitions, component animations, gestures |
| React/Next.js | **React Spring** | Physics-based, fluid animations |
| Any (CSS-only) | **Tailwind animate** + **tailwindcss-animate** | Utility-class animations, entry/exit |
| Any | **GSAP** | Complex timeline animations, scroll-triggered |
| Vue | **@vueuse/motion** | Vue-native motion utilities |
| Landing pages | **Lottie** | Vector animations from After Effects exports |
| Scroll effects | **Framer Motion scroll** / **GSAP ScrollTrigger** | Parallax, reveal on scroll |

**Rule:** Always confirm with the project's package.json before recommending — check if an animation library is already installed.

---

## Animation Principles

- **Duration:** Micro-interactions 100–300ms, page transitions 300–500ms, complex sequences up to 800ms
- **Easing:** Use natural curves — `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for in-place changes
- **Purpose:** Every animation must serve a function (feedback, orientation, focus direction) — no decorative animation
- **Reduced motion:** Always implement `prefers-reduced-motion` media query alternative
- **Performance:** Use `transform` and `opacity` only for smooth animations — never animate `width`, `height`, `top`, `left`

---

## Landing Page Design

When designing marketing/landing pages:

1. **Ask for Cloudinary path** for video backgrounds, hero animations, brand motion assets
2. Structure: Hero → Problem → Solution → Social Proof → CTA → FAQ → Footer
3. Hero video: autoplay, muted, loop, `prefers-reduced-motion` fallback to static image
4. Above-the-fold: single clear headline (H1), supporting line (H2), primary CTA
5. CTA hierarchy: one primary CTA per section, secondary CTA for low-commitment actions
6. Animation strategy: scroll-reveal for sections (GSAP ScrollTrigger or Framer Motion)
7. Performance: lazy-load below-fold images, use next/image or Cloudinary auto-format

---

## Collaboration Patterns

- **with ux-design**: Receive wireframes with layout intent; own the visual layer from that point
- **with design-systems**: Propose new tokens/components to design system before building one-offs
- **with accessibility-design**: Color decisions require contrast sign-off before finalizing
- **with interaction-design**: Collaborate on motion spec — UI sets visual style, Interaction defines timing/behavior
- **with frontend-engineer**: Deliver Figma with Dev Mode or CSS spec; review implementation against design in browser
- **with frontend-performance**: Optimize image exports, animation frame rates, font loading strategy

---

## Anti-Patterns

- Hardcoding color hex values instead of using tokens
- Designing only default state — forgetting hover, focus, error, disabled, loading, empty
- Arbitrary spacing — any value not on the 4/8 scale
- Purely decorative animations with no functional purpose
- Landing page animations without `prefers-reduced-motion` fallback
- Using more than 2 typefaces
- Using color alone to communicate state (accessibility violation)
- Animating `width`/`height` (GPU-expensive — use `transform: scaleX()` instead)

---

## Checklist Before Handoff

- [ ] Design.md tokens applied throughout (no hardcoded values)
- [ ] All component states designed (default, hover, focus, active, disabled, error, loading, empty)
- [ ] Typography from defined type scale only
- [ ] Spacing from 4/8-base scale only
- [ ] Color contrast meets WCAG AA (4.5:1 body, 3:1 large text)
- [ ] Animation: purpose defined, duration/easing specified, reduced-motion alternative provided
- [ ] Cloudinary assets referenced if landing page contains video/motion
- [ ] Figma Dev Mode or CSS spec exported
- [ ] Responsive variants for mobile/tablet/desktop
- [ ] Dark mode variants if project supports dark mode
