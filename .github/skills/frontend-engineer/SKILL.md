---
name: frontend-engineer
description: Universal frontend engineering skill covering component architecture, state management, routing, forms, and performance. Works across React, Next.js, Vue, Svelte, and any modern frontend framework. Query Context7 MCP for live framework-specific documentation before generating framework-specific code.
applyTo: ["**/*.tsx", "**/*.jsx", "**/*.ts", "**/*.vue", "**/*.svelte"]
teamRole: Engineering
relatedSkills:
  - ui-design
  - accessibility-design
  - frontend-testing
  - frontend-performance
  - ux-design
expertise:
  - component-architecture
  - state-management
  - routing
  - forms-validation
  - api-integration
  - performance
  - accessibility
---

# Frontend Engineer Skill

## Role Overview
The frontend engineer translates design specifications and product requirements into functional, accessible, and performant user interfaces. Responsible for component architecture, state management, API integration, and ensuring a consistent user experience across devices and browsers.

> **Context7 MCP**: Before writing framework-specific code, instruct Copilot to query Context7 MCP for the latest API docs for the framework in use (e.g., "use context7 to get Next.js App Router docs").

---

## Core Responsibilities

- Build reusable, composable UI components with clear APIs (props/events)
- Manage client state (local, server, form, URL state) appropriately
- Integrate with backend APIs using typed HTTP clients
- Implement form validation with schema-based validators (Zod, Yup, Valibot)
- Ensure responsive layouts across all breakpoints
- Meet WCAG 2.1 AA accessibility requirements
- Write component tests and integration tests
- Optimize bundle size and runtime performance

---

## Component Architecture Principles

### Component Design
```
- Single responsibility: one component, one concern
- Accept data via props, emit changes via callbacks/events
- Co-locate styles, tests, and component logic in the same folder
- Prefer composition over inheritance
- Keep components under 200 lines; extract sub-components when larger
```

### Folder Structure (framework-agnostic)
```
components/
  ui/             ← Primitive, stateless, fully reusable (Button, Input, Modal)
  forms/          ← Form-aware components with validation
  layout/         ← Structural layout components (Header, Sidebar, Grid)
  features/       ← Domain-specific, composed from ui/ components
  pages/          ← Route-level components (thin — just wire feature components)
```

### State Management Decision Tree
```
Local UI state (toggle, hover)     → useState / local reactive variable
Form state                         → react-hook-form / VueUse Form / SvelteKit form
Server/async data                  → react-query / SWR / useFetch (Nuxt)
Complex shared state               → Zustand / Pinia / Svelte stores
URL state (filters, pagination)    → useSearchParams / nuxt-route
Global config (theme, user)        → Context API / provide-inject
```

---

## Forms Best Practices

```typescript
// Always use schema-first validation shared with backend
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

// Schema lives in a shared package (@repo/validations or shared/schemas)
const schema = z.object({
  email: z.string().email("Invalid email"),
  amount: z.coerce.number().positive("Must be positive"),
})

// Form is typed end-to-end
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { email: "", amount: "" }
})

// Transform on submit — never mutate raw form values
async function onSubmit(values: z.infer<typeof schema>) {
  const payload = { ...values }
  await api.post("/endpoint", payload)
}
```

### Form Anti-Patterns
- ❌ Don't validate only on submit — validate `onChange` for better UX
- ❌ Don't store transformed types back into form state
- ❌ Don't use `any` for form values — always derive types from schema
- ❌ Don't make API calls directly in `onChange` without debouncing

---

## API Integration

```typescript
// Use a typed API client, never raw fetch in components
// Create a centralized api module
const api = {
  get: async <T>(url: string): Promise<T> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`)
    if (!res.ok) throw new ApiError(res.status, await res.text())
    return res.json()
  },
  post: async <T, B>(url: string, body: B): Promise<T> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new ApiError(res.status, await res.text())
    return res.json()
  }
}

// Surface loading and error states to the user — never silently fail
const { data, isLoading, error } = useQuery({
  queryKey: ["resource", id],
  queryFn: () => api.get(`/resource/${id}`)
})
```

---

## Responsive Design Checklist

- [ ] Test at 375px (small mobile), 768px (tablet), 1280px (desktop), 1920px (wide)
- [ ] Use CSS Grid / Flexbox — never fixed pixel widths for layout
- [ ] Text must scale with viewport — use responsive type scales
- [ ] Touch targets: minimum 44×44px on mobile
- [ ] Images use `srcset` or `<Image>` component with proper sizing
- [ ] No horizontal scroll on mobile

---

## Accessibility Checklist

- [ ] All interactive elements are keyboard-navigable (Tab → Enter/Space)
- [ ] Focus indicators are visible and high-contrast
- [ ] Form inputs have associated `<label>` or `aria-label`
- [ ] Error messages linked to inputs via `aria-describedby`
- [ ] Color is not the only means of conveying information
- [ ] Page has one `<h1>`, logical heading hierarchy
- [ ] Images have meaningful `alt` text (or `alt=""` for decorative)
- [ ] Modal/dialog traps focus when open, restores on close
- [ ] Sufficient color contrast (4.5:1 normal, 3:1 large text)

---

## Security Rules

- **Never** render raw HTML from user input or API responses (`dangerouslySetInnerHTML`)
- Sanitize any HTML you must render with `DOMPurify` or equivalent
- **Never** store tokens/secrets in `localStorage` — use `HttpOnly` cookies
- Validate all inputs client-side (UX) AND server-side (security)
- Use `Content-Security-Policy` headers to prevent XSS
- Avoid dynamically constructing URLs from user input

---

## Pre-Handoff Checklist

- [ ] Component renders at all responsive breakpoints without overflow
- [ ] All form fields have validation with user-friendly error messages
- [ ] Loading and error states are handled and visible
- [ ] No TypeScript `any` types without justification
- [ ] No `console.log` in production code
- [ ] Component is keyboard-navigable
- [ ] Accessibility violations checked (Axe DevTools / browser a11y audit)
- [ ] API error responses surface to the user (not silently swallowed)
- [ ] Bundle impact considered for new dependencies

---

## Collaboration Patterns

- **↔ ui-design**: Receive component specs from design; flag any layout constraints before implementing
- **↔ ux-design**: Review user flows before building new pages; ask about edge cases and empty states
- **↔ accessibility-design**: Get a11y requirements per component before coding
- **↔ frontend-testing**: Coordinate on component test coverage and testing patterns
- **↔ backend-engineer**: Agree on API contract (request/response shape) before building UI
- **↔ tech-lead**: Escalate novel state management or routing decisions before implementing
