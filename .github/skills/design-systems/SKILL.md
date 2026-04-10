---
name: design-systems
description: Universal design systems skill covering component libraries, design tokens, documentation, versioning, and governance. Apply when building or maintaining a shared component library, defining tokens, or standardizing design across teams. Reads design.md for project design foundation.
applyTo: ["**/*.css", "**/*.scss", "**/*.tsx", "**/*.jsx", "**/*.md", "**/*.json"]
teamRole: Design
relatedSkills:
  - ui-design
  - ux-design
  - accessibility-design
  - frontend-engineer
  - frontend-performance
expertise:
  - design-tokens
  - component-libraries
  - documentation
  - versioning
  - design-governance
---

# Design Systems Skill

## Activation

Read `.github/design.md` before any decision — all tokens, component library, and naming conventions are defined there.

---

## Role Overview

Design Systems engineers own the shared language between design and engineering. They build component libraries, define design tokens, document usage, enforce consistency, and govern contribution workflows. A good design system is a force-multiplier: build it once, use everywhere.

---

## Core Responsibilities

- Define and maintain design tokens (color, spacing, typography, elevation, radius, motion)
- Build and document reusable components
- Enforce visual and behavioral consistency across products
- Manage versioning and changelog
- Govern contribution process (proposals, reviews, deprecations)
- Provide migration guides for breaking changes

---

## Design Token Architecture

### Token Levels (Three-Tier Model)

```
Tier 1 — Primitive Tokens (raw values)
  color.blue.500 = #3B82F6
  space.4 = 16px
  font.size.base = 16px

Tier 2 — Semantic Tokens (intent-based, reference primitives)
  color.interactive.primary = color.blue.500
  color.text.default = color.neutral.900
  space.component.padding.md = space.4

Tier 3 — Component Tokens (component-specific, reference semantic)
  button.background.primary = color.interactive.primary
  button.padding.horizontal = space.component.padding.md
```

**Rule:** Components consume Tier 3 tokens only. Never reference primitives directly in component code.

### Token Formats

- **CSS Custom Properties**: `--color-interactive-primary: #3B82F6`
- **Tailwind config**: `colors: { 'interactive-primary': 'var(--color-interactive-primary)' }`
- **JSON (Style Dictionary)**: For multi-platform (web + native) token distribution
- **Figma Variables**: Sync with style-dictionary for design/code parity

---

## Component Architecture

### Component Anatomy
Every component has:
- **Structure** — HTML/JSX skeleton
- **Variants** — visual variations (primary, secondary, destructive, ghost)
- **Sizes** — sm/md/lg (or xs/sm/md/lg/xl)
- **States** — default, hover, focus, active, disabled, loading, error
- **Slots/Composition** — what content can be inserted
- **Props API** — documented TypeScript interface

### Component Categories

| Category | Examples |
|----------|---------|
| Primitives | Button, Input, Checkbox, Radio, Select, Textarea |
| Layout | Stack, Grid, Container, Divider, Spacer |
| Navigation | NavBar, Tabs, Breadcrumb, Pagination, Sidebar |
| Feedback | Toast, Alert, Banner, Badge, Progress, Spinner |
| Overlay | Modal, Drawer, Popover, Tooltip, DropdownMenu |
| Data Display | Table, Card, List, Avatar, Stat, Tag |
| Forms | Form, FormField, FormLabel, FormError, FormGroup |
| Charts | BarChart, LineChart, PieChart (wrapper over Recharts/Victory) |

---

## Documentation Standards

Every component must have:

```markdown
## ComponentName

Short description of purpose.

### Usage
\`\`\`tsx
import { ComponentName } from '@your-org/ui'
<ComponentName variant="primary" size="md" />
\`\`\`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'primary' \| 'secondary' | 'primary' | Visual style |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Component size |
| disabled | boolean | false | Disables interaction |

### Variants
[Screenshot/Storybook embed of each variant]

### Accessibility
- Focus ring: visible on keyboard navigation
- ARIA attributes: list any required aria-* props
- Screen reader: announce behavior

### Do / Don't
✅ Do: Use primary variant for the main action per page
❌ Don't: Use multiple primary buttons in the same section
```

---

## Versioning & Changelog

Follow **Semantic Versioning** (semver):
- `MAJOR` — breaking changes (token renames, prop removals, behavior changes)
- `MINOR` — new components, new props, new token additions
- `PATCH` — bug fixes, documentation, style tweaks with no API change

### Changelog Entry Format
```markdown
## [2.1.0] - 2026-03-01

### Added
- `Accordion` component with keyboard navigation support

### Changed
- `Button`: added `loading` prop with spinner state

### Deprecated
- `color.brand.primary` token → use `color.interactive.primary` (removed in 3.0)

### Fixed
- `Select`: dropdown z-index conflict with Modal resolved
```

---

## Contribution Governance

### New Component Proposal Process
1. Raise a GitHub issue with component proposal template
2. Design review: does it exist? can it be composed from primitives?
3. Design spec in Figma with all states
4. Engineering implementation with Storybook stories
5. Accessibility audit (axe-core + manual screen reader test)
6. Documentation PR with Do/Don't examples
7. Changelog entry + version bump

### Token Change Process
- **Additive**: Open PR, document in changelog, release as MINOR
- **Rename**: Deprecate old, add new alias, provide codemod, remove in next MAJOR
- **Breaking**: RFC process, migration guide required, 3-month deprecation window

---

## Collaboration Patterns

- **with ui-design**: Design system consumes design decisions from UI design; UI design must use system tokens, not custom values
- **with frontend-engineer**: Provide TypeScript prop types, Storybook stories, and usage examples
- **with accessibility-design**: All components must pass accessibility audit before release
- **with frontend-performance**: Tree-shakeable exports, no barrel imports that bloat bundles

---

## Anti-Patterns

- Components with `style` prop overrides that bypass the token system
- One-off colors or spacing not in the token system
- Components without all required states documented
- Breaking changes without migration guide
- Skipping accessibility audit for "simple" components
- Separate design tokens in Figma vs code — always keep in sync
- `!important` in component CSS

---

## Checklist

- [ ] Tokens follow three-tier model (primitive → semantic → component)
- [ ] Component has all variants, sizes, and states
- [ ] TypeScript interface fully typed with JSDoc comments
- [ ] Storybook story for every variant + state
- [ ] Accessibility audit passed (axe-core + keyboard nav + screen reader)
- [ ] Do/Don't documentation with visual examples
- [ ] Changelog entry with semver bump
- [ ] Migration guide if breaking change
- [ ] Design.md updated if new tokens added
- [ ] Figma Variables in sync with code tokens
