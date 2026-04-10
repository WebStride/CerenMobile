---
name: interaction-design
description: Universal interaction design skill covering micro-interactions, animation principles, transition patterns, gesture design, feedback loops, and state-driven UI behavior. Apply when designing or building interactive components, transitions, or animations. Reads design.md for brand motion tokens. Recommends animation libraries (Framer Motion, GSAP, Lottie, CSS animations). Asks for Cloudinary path for video/motion assets.
applyTo: ["**/*.tsx", "**/*.jsx", "**/*.css", "**/*.scss"]
teamRole: "Design"
relatedSkills:
  - ui-design
  - ux-design
  - accessibility-design
  - frontend-engineer
expertise:
  - Micro-interactions
  - Animation principles
  - Transition patterns
  - Gesture design
  - Motion design systems
---

# Interaction Design Skill

## Role Overview
Design the dynamic layer of the product — how elements respond, transition, and communicate state through motion and feedback. Interaction design makes the interface feel alive, intuitive, and trustworthy.

> **Before generating interaction specs:** Read `.github/design.md` for brand motion tokens (duration, easing, animation style). If video or Lottie motion assets are needed, ask: *"What is the Cloudinary path for the animation/video assets?"*

## Core Responsibilities
- Design micro-interactions that communicate state changes clearly
- Define motion principles and animation vocabulary for the design system
- Specify transitions between pages, views, and states
- Design gesture interactions for touch interfaces
- Create feedback loops (loading, success, error, empty states)
- Document interaction specs for developer handoff

## Animation Library Recommendations

| Use Case | Recommended Library |
|----------|-------------------|
| React component animations | **Framer Motion** |
| Complex timeline animations | **GSAP** |
| Lottie/JSON animations | **lottie-react** or **@lottiefiles/react-lottie-player** |
| CSS-only micro-interactions | Native CSS transitions + animations |
| Scroll-based animations | **Framer Motion + useScroll** or **GSAP ScrollTrigger** |
| SVG animations | **GSAP** or **Framer Motion** |
| 3D animations | **Three.js** + **@react-three/fiber** |
| Spring physics | **react-spring** or **Framer Motion spring** |

> Always check Cloudinary for hosted Lottie JSON files and video assets before creating new ones.

## Animation Principles (Disney's 12 Principles Applied to UI)

### Core Principles for Digital Products
1. **Squash and Stretch**: Elements scale slightly on interaction to feel physical (buttons press in)
2. **Anticipation**: Brief preparation before action (button depresses before submitting)
3. **Staging**: Guide attention — animate the most important element first
4. **Follow Through**: Elements don't stop abruptly — they ease out naturally
5. **Slow In and Slow Out**: All motion eases — never linear unless intentional
6. **Arcs**: Natural movement follows arcs, not straight lines
7. **Secondary Action**: Supporting animations reinforce the main action
8. **Timing**: Duration reflects weight and importance of the element
9. **Exaggeration**: Subtle exaggeration creates delight and emphasis

### Motion Duration Scale
```
Instant:    0ms       — No animation (reduced motion)
Flash:      50–100ms  — Micro-feedback (button press)
Quick:      100–200ms — Small state changes (toggle, check)
Normal:     200–300ms — Standard transitions (dropdown, tooltip)
Moderate:   300–400ms — Component enter/exit (modal, sheet)
Slow:       400–500ms — Page transitions, complex layouts
Deliberate: 500–800ms — Onboarding, celebration moments
```

### Easing Reference
```css
/* Standard easing curve library */
--ease-standard:      cubic-bezier(0.2, 0, 0, 1);    /* Most UI transitions */
--ease-decelerate:    cubic-bezier(0, 0, 0, 1);       /* Elements entering screen */
--ease-accelerate:    cubic-bezier(0.3, 0, 1, 1);     /* Elements leaving screen */
--ease-in-out:        cubic-bezier(0.4, 0, 0.2, 1);   /* Emphasized transitions */
--ease-spring:        /* Use spring physics for playful interactions */
```

## Micro-Interaction Patterns

### Button States
```typescript
// Framer Motion button interaction
const buttonVariants = {
  idle:     { scale: 1 },
  hover:    { scale: 1.02, transition: { duration: 0.15 } },
  tap:      { scale: 0.97, transition: { duration: 0.1 } },
  loading:  { opacity: 0.7 },
  disabled: { opacity: 0.4, cursor: 'not-allowed' }
};
```

### Form Field Feedback
- **Focus**: Border color transition + label float animation (150ms ease)
- **Valid**: Subtle green border + checkmark fade in (200ms)
- **Error**: Red border + error message slide down (200ms) + subtle shake (300ms)
- **Disabled**: Reduced opacity + cursor change (instant)

### Toggle / Switch
- Track color: cross-fade (200ms)
- Thumb: spring slide (`stiffness: 500, damping: 30`)
- Icon inside thumb: scale + rotate (150ms)

### Loading States
- **Skeleton**: Shimmer animation (1.5s infinite, left-to-right)
- **Spinner**: Continuous rotation, 1s ease-in-out infinite
- **Progress bar**: Smooth width transition
- **Skeleton → Content**: Fade in (200ms) after data loads

### Success / Error Feedback
- **Success toast**: Slide in from bottom + icon draw (300ms) → auto-dismiss (3s) → fade out (200ms)
- **Error state**: Shake animation + red highlight (brief, 400ms total)
- **Completion celebration**: Confetti, checkmark draw, or ripple — use Lottie for complex animations

## Page and Route Transitions

### Standard Page Transition Pattern
```typescript
// Framer Motion page transitions
const pageVariants = {
  initial:  { opacity: 0, y: 8 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.2, 0, 0, 1] } },
  exit:     { opacity: 0, y: -8, transition: { duration: 0.15 } }
};
```

### Modal / Sheet Entrance
```typescript
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 }
  },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.15 } }
};

// Bottom sheet (mobile)
const sheetVariants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 35 } },
  exit: { y: '100%', transition: { duration: 0.2, ease: 'easeIn' } }
};
```

### Staggered List Animation
```typescript
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};
```

## Gesture Design (Touch Interfaces)

### Core Touch Gestures
| Gesture | Use Case | Threshold |
|---------|----------|-----------|
| Tap | Primary action | < 200ms, < 10px move |
| Long press | Context menu, drag handle | > 500ms |
| Swipe left/right | Delete, navigation, dismiss | > 80px |
| Swipe down | Pull-to-refresh, dismiss sheet | > 100px |
| Pinch | Zoom, expand/collapse | Detect scale change |
| Drag | Reorder, resize, scrub | Continuous tracking |

### Swipe-to-Dismiss Pattern
```typescript
const dragConstraints = { left: 0, right: 0, top: 0 };

<motion.div
  drag="x"
  dragConstraints={dragConstraints}
  onDragEnd={(_, info) => {
    if (info.offset.x < -100 || info.velocity.x < -500) {
      onDismiss();
    }
  }}
>
```

## State-Driven Animation

### Define All States Explicitly
Every interactive element should define motion for:
- `default` → `hover`
- `default` → `focus`
- `default` → `active` (pressed)
- `default` → `loading`
- `loading` → `success`
- `loading` → `error`
- `default` → `disabled`
- Enter (mount)
- Exit (unmount)

### Layout Animation
```typescript
// AnimatePresence for enter/exit
<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div key="content" initial="hidden" animate="visible" exit="exit">
      {/* content */}
    </motion.div>
  )}
</AnimatePresence>

// layoutId for shared element transitions
<motion.img layoutId="hero-image" src={thumbnail} />
// On detail page:
<motion.img layoutId="hero-image" src={fullImage} />
```

## Interaction Spec Template (for Design Handoff)

```
Component: [Name]
Trigger: [click / hover / focus / scroll / drag]
Initial State: [description]
Final State: [description]
Duration: [Xms]
Easing: [ease-standard / spring(stiffness, damping)]
Animation Properties: [opacity, transform, color, etc.]
Delay: [Xms after trigger]
Interruption: [how does it behave if re-triggered mid-animation?]
Reduced Motion: [alternative for prefers-reduced-motion]
```

## Reduced Motion — Always Required
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
```typescript
// Framer Motion
const shouldReduceMotion = useReducedMotion();
const variants = shouldReduceMotion ? staticVariants : animatedVariants;
```

## Anti-Patterns
- Animation for no reason — every motion must serve communication
- Linear easing (always looks robotic; use ease curves)
- Blocking animations (never block user interaction during animation)
- Long durations > 500ms for functional transitions
- Infinite looping decorative animations (visually fatiguing)
- Animating layout-triggering properties (use `transform` and `opacity` only for performance)
- No reduced motion alternative
- Animations that could trigger vestibular disorders (parallax, zoom, spinning)

## Performance Rules
- Animate only `transform` and `opacity` — these are GPU-composited
- Avoid animating `width`, `height`, `margin`, `padding` (trigger layout reflow)
- Use `will-change: transform` sparingly on elements that animate frequently
- Use `content-visibility: auto` for off-screen animated content
- Throttle scroll-based animations with `requestAnimationFrame`

## Collaboration Patterns
- **With UI Designer**: Define shared motion token library (duration, easing) in `design.md`
- **With Accessibility Designer**: Review all animations for reduced-motion compliance
- **With Frontend Engineer**: Provide complete state machine + easing specs; recommend specific library
- **With UX Designer**: Validate transitions support user mental model (feels natural, not jarring)
- **With Product Manager**: Advocate for animation QA time in sprint estimates

## Pre-Handoff Checklist
- [ ] All interactive states documented with duration + easing
- [ ] `prefers-reduced-motion` alternative specified for every animation
- [ ] Animation library recommendation noted in spec
- [ ] Lottie/video assets uploaded to Cloudinary (path provided)
- [ ] Performance-safe properties only (`transform`, `opacity`)
- [ ] Framer Motion / CSS code snippet provided for complex interactions
- [ ] Shared motion tokens defined in `design.md`
