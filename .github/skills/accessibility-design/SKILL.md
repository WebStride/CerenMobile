---
name: accessibility-design
description: Universal accessibility design skill covering WCAG compliance, inclusive design patterns, screen reader support, keyboard navigation, color contrast, and assistive technology testing. Apply when building UI components, auditing existing interfaces, or ensuring inclusive user experiences.
applyTo: ["**/*.tsx", "**/*.jsx", "**/*.html", "**/*.css", "**/*.scss"]
teamRole: "Design"
relatedSkills:
  - ui-design
  - ux-design
  - frontend-engineer
  - frontend-testing
expertise:
  - WCAG 2.1/2.2 compliance
  - Inclusive design
  - Screen reader testing
  - Keyboard navigation
  - Color contrast and visual accessibility
---

# Accessibility Design Skill

## Role Overview
Ensure every user — regardless of ability — can perceive, understand, navigate, and interact with the product. Accessibility is not a feature; it is a quality baseline.

## Core Responsibilities
- Audit interfaces against WCAG 2.1 AA (minimum) and AAA where feasible
- Design inclusive patterns from the start — not as a retrofit
- Test with real assistive technologies (NVDA, JAWS, VoiceOver, TalkBack)
- Define accessible color palettes, typography scales, and focus states
- Create keyboard-navigable interaction patterns
- Document accessibility requirements in design specs for handoff

## WCAG 2.1 Compliance Framework

### Four Principles (POUR)
| Principle | Meaning | Key Checks |
|-----------|---------|------------|
| **Perceivable** | Info must be presentable to all senses | Alt text, captions, contrast ratio |
| **Operable** | UI must be navigable by all input methods | Keyboard, focus order, timing |
| **Understandable** | Content and UI must be clear | Labels, error messages, language |
| **Robust** | Content must be parsed by assistive tech | Semantic HTML, ARIA, valid markup |

### Minimum Targets
- **Color contrast**: 4.5:1 for normal text, 3:1 for large text (AA)
- **Focus indicator**: Visible on all interactive elements
- **Target size**: Minimum 44×44px touch targets
- **Text resize**: No loss of content at 200% zoom
- **Motion**: Respect `prefers-reduced-motion`

## Inclusive Design Patterns

### Semantic HTML First
```html
<!-- ❌ Never use div soup -->
<div class="button" onclick="submit()">Submit</div>

<!-- ✅ Use semantic elements -->
<button type="submit">Submit</button>

<!-- ✅ Use landmarks -->
<header>, <nav>, <main>, <aside>, <footer>
<section aria-labelledby="section-heading">
```

### ARIA Usage Rules
1. **First rule of ARIA**: Don't use ARIA — use semantic HTML instead
2. **Second rule**: Never change native semantics unless absolutely necessary
3. **Required ARIA patterns**:
   - Dynamic regions: `aria-live="polite"` for non-urgent updates
   - Modal dialogs: `role="dialog"` + `aria-modal="true"` + focus trap
   - Disclosure widgets: `aria-expanded` + `aria-controls`
   - Error states: `aria-invalid="true"` + `aria-describedby` → error message

### Form Accessibility
```html
<!-- Every input needs an associated label -->
<label for="email">Email address</label>
<input id="email" type="email" aria-required="true"
       aria-describedby="email-error email-hint" />
<span id="email-hint">We'll never share your email</span>
<span id="email-error" role="alert" aria-live="assertive">
  Please enter a valid email
</span>
```

### Keyboard Navigation
- `Tab` / `Shift+Tab`: Move between interactive elements
- `Enter` / `Space`: Activate buttons and links
- `Arrow keys`: Navigate within composites (menus, tabs, radio groups)
- `Escape`: Close dialogs, popovers, menus
- **Never remove focus outline** — style it instead:
```css
:focus-visible {
  outline: 3px solid #005FCC;
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Focus Management
- Opening a modal → move focus to first focusable element inside
- Closing a modal → return focus to the trigger element
- Loading new content → announce with `aria-live` or move focus to heading
- Infinite scroll → provide keyboard-accessible alternative

### Color & Contrast
- Never use color alone to convey information (add icons, text, patterns)
- Test with grayscale filter to verify non-color indicators
- Tools: Colour Contrast Analyser, axe DevTools, Stark (Figma plugin)
- Ensure interactive states (hover, focus, active, disabled) all meet contrast

## Component Accessibility Checklist

### Buttons
- [ ] Uses `<button>` element or `role="button"` + `tabindex="0"`
- [ ] Descriptive label (not just "Click here" or "Submit")
- [ ] Icon-only buttons have `aria-label`
- [ ] Disabled state uses `disabled` attribute, not just visual styling
- [ ] Loading state announces to screen readers

### Links
- [ ] Descriptive link text (not "Click here" / "Read more")
- [ ] Opens-new-tab links have `aria-label="...opens in new tab"`
- [ ] External links visually indicated

### Images
- [ ] Informative images have descriptive `alt` text
- [ ] Decorative images have `alt=""`
- [ ] Complex images have extended description (`aria-describedby` or `longdesc`)
- [ ] Avoid text in images; if unavoidable, repeat in alt

### Modals/Dialogs
- [ ] `role="dialog"` + `aria-modal="true"`
- [ ] `aria-labelledby` pointing to dialog heading
- [ ] Focus trapped within modal while open
- [ ] `Escape` closes modal
- [ ] Focus returns to trigger on close

### Data Tables
- [ ] `<th>` elements with `scope="col"` or `scope="row"`
- [ ] `<caption>` or `aria-label` describing table purpose
- [ ] Complex tables use `id`/`headers` attributes

### Custom Components (Dropdown, Combobox, Tabs)
- Follow [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/) patterns exactly
- Keyboard interactions documented in spec

## Testing Approach

### Automated (Catch ~30% of Issues)
- **axe-core**: Integrate into CI pipeline
- **jest-axe**: Unit-level accessibility assertions
- **Lighthouse**: Accessibility audit in CI
- **Storybook a11y addon**: Component-level testing

### Manual Screen Reader Testing
| OS | Screen Reader | Browser |
|----|--------------|---------|
| Windows | NVDA (free) | Firefox or Chrome |
| Windows | JAWS | Chrome or Edge |
| macOS | VoiceOver (built-in) | Safari |
| iOS | VoiceOver | Safari |
| Android | TalkBack | Chrome |

### Manual Keyboard Testing
1. Unplug/disable mouse
2. Navigate entire page with Tab, Shift+Tab, Arrow keys, Enter, Space, Escape
3. Verify focus is always visible
4. Verify logical focus order matches visual order
5. Verify all interactive elements are reachable

### Automated CI Integration
```yaml
# In CI pipeline
- name: Run accessibility tests
  run: npx axe-cli http://localhost:3000
```

```javascript
// jest-axe example
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('Button has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Motion and Animation Accessibility
```css
/* Always wrap animations in this media query */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Design Handoff Requirements
Include in every component spec:
- [ ] Tab order diagram for complex components
- [ ] Screen reader announcement text
- [ ] Focus state design (visible, high-contrast)
- [ ] Color contrast ratios documented
- [ ] Error state announcements
- [ ] ARIA roles and attributes table

## Common Anti-Patterns
- Using `tabindex` values > 0 (breaks natural tab order)
- Removing focus styles entirely (`outline: none` without replacement)
- `aria-label` that duplicates visible text (redundant) or contradicts it (confusing)
- Keyboard traps (focus enters an area and cannot escape)
- Content that auto-advances or has time limits without user control
- Icon-only interactive elements without accessible names
- Placeholder text as the only form label (disappears on focus)
- Low contrast disabled states (still needs 3:1 ratio)

## Collaboration Patterns
- **With UI Designer**: Review color palette for contrast before finalizing; define focus state designs
- **With UX Designer**: Audit user flows for keyboard-only paths; ensure error recovery is accessible
- **With Frontend Engineer**: Provide ARIA spec and keyboard interaction table; review implementation
- **With QA**: Define accessibility regression tests; pair on screen reader testing sessions
- **With Product Manager**: Include accessibility in acceptance criteria; estimate remediation effort

## Pre-Handoff Checklist
- [ ] WCAG 2.1 AA audit completed (automated + manual)
- [ ] Keyboard navigation fully functional
- [ ] Screen reader tested on VoiceOver (macOS/iOS) and NVDA (Windows)
- [ ] Color contrast passes 4.5:1 for all text
- [ ] All images have appropriate alt attributes
- [ ] All forms have associated labels and error messages
- [ ] Focus management correct for modals and dynamic content
- [ ] `prefers-reduced-motion` rule in place
- [ ] `prefers-color-scheme` dark mode is accessible too
