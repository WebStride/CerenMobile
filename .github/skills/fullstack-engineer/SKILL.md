---
name: fullstack-engineer
description: Universal full-stack engineering skill combining frontend and backend expertise. Applies to feature work that spans UI, API, and database layers. Coordinates across the stack to ship complete vertical slices.
applyTo: ["**/*.tsx", "**/*.jsx", "**/*.ts", "**/*.js", "**/*.py", "**/*.go"]
teamRole: Engineering
relatedSkills:
  - frontend-engineer
  - backend-engineer
  - api-design
  - fullstack-engineer
  - monorepo-patterns
expertise:
  - vertical-slice-delivery
  - api-contract-design
  - end-to-end-data-flow
  - full-stack-debugging
  - shared-types
  - monorepo-coordination
---

# Full-Stack Engineer Skill

## Role Overview
The full-stack engineer owns the entire feature slice — from database schema through API to UI. They are the primary driver of vertical features, responsible for ensuring the frontend and backend contracts align, shared types are consistent, and the feature works end-to-end.

> **Context7 MCP**: Query Context7 for framework-specific patterns at both layers before building. Example: "use context7 to get Next.js Server Actions docs" or "use context7 to get tRPC docs".

---

## Core Responsibilities
- Design API contracts before building either layer (contract-first)
- Implement database schema + migration
- Build API endpoints with validation and error handling
- Build UI components consuming the API
- Write shared TypeScript types used by both layers
- Ship fully working features with tests at all layers
- Coordinate with designers and product for requirements clarity

---

## Full-Stack Feature Workflow

### Step 1 — Understand Requirements
Before writing any code:
- Read the acceptance criteria
- Identify all API endpoints needed
- Identify all DB schema changes required
- Check if existing endpoints can be reused/extended
- Ask: "What is the error state for every interaction?"

### Step 2 — Design the Contract (API First)
Define the API shape before building either side:
```typescript
// Shared types (e.g., packages/types/orders.ts)
export interface CreateOrderRequest {
  productId: string;
  quantity: number;
  deliveryAddress: string;
}

export interface CreateOrderResponse {
  id: string;
  status: 'pending' | 'confirmed';
  estimatedDelivery: string;
}
```

### Step 3 — Build Bottom-Up
1. DB migration (schema change)
2. Repository/data layer
3. Service/business logic
4. API route/controller
5. UI integration layer (fetch / mutation hook)
6. UI components
7. Tests at each layer

### Step 4 — Vertical Slice Review
Before marking complete:
- [ ] Happy path works end-to-end in dev
- [ ] Error states are handled on both frontend and backend
- [ ] Loading states are shown in UI
- [ ] Form validation matches API validation rules
- [ ] Optimistic updates (if applicable) revert on failure

---

## Shared Types Pattern

In a monorepo, define types once and share:
```
packages/
  types/
    orders.ts      ← shared request/response types
    users.ts
apps/
  api/             ← imports from @repo/types
  web/             ← imports from @repo/types
```

This eliminates type drift between frontend and backend.

---

## End-to-End Data Flow

```
User Action (UI)
  → Input Validation (frontend: Zod/yup)
  → API Request (fetch/axios/trpc)
  → Route Handler (controller)
  → Input Validation (backend: Zod)
  → Service (business logic)
  → Repository (database query)
  → Response mapping
  → UI state update
```

Every layer validates. The backend is the source of truth for validation rules. The frontend mirrors them for UX, but backend always enforces.

---

## Common Pitfalls

### Type Drift
Frontend and backend types diverging silently:
- **Fix**: Use a shared types package in the monorepo
- **Fix**: Use tRPC, GraphQL codegen, or OpenAPI client generation

### Optimistic Update Bugs
UI shows success but API failed:
- **Fix**: Always revert optimistic updates on API error
- **Fix**: Show error toast + restore previous state

### Over-fetching
Fetching entire resources when only partial data is needed:
- **Fix**: Add query parameters for field selection
- **Fix**: Create purpose-built API endpoints for specific use cases

### N+1 in Full-Stack Contexts
Loading list on frontend then fetching each item individually:
- **Fix**: Build aggregate API endpoints that return joined data
- **Fix**: Use `include`/`join` in ORM queries

---

## Debugging Full-Stack Issues

### Systematic Approach
1. Confirm request leaves the browser (Network tab → check request payload)
2. Confirm request reaches backend (server logs)
3. Confirm DB query runs correctly (query logs/explain)
4. Confirm response is correct (log response body)
5. Confirm frontend parses response correctly (console log)

### Common Bugs by Layer
| Symptom | Likely Layer |
|---------|-------------|
| CORS error | Backend middleware config |
| 401 unexpected | Auth token not attached / expired |
| Data shows but stale | Client-side cache not invalidated |
| Form submits but no DB change | Missing `await` on async DB call |
| Type error after API change | Shared types out of sync |

---

## Collaboration Patterns

| Partner | When |
|---------|------|
| **frontend-engineer** | When UI complexity warrants specialization |
| **backend-engineer** | When backend performance/security needs deep expertise |
| **api-design** | When designing public-facing or partner APIs |
| **ux-design** | Before building UI — review flows first |
| **qa-strategy** | Define E2E test cases for the feature |
| **monorepo-patterns** | When setting up shared packages or workspace config |

---

## Anti-Patterns
- Building UI before API contract is agreed
- Duplicating type definitions in frontend and backend
- Skipping error state handling ("we'll add it later")
- Mixing UI component logic with data fetching — separate concerns
- Not testing the full slice before handing off

---

## Pre-Handoff Checklist
- [ ] API contract defined and shared types exist
- [ ] DB migration tested (up + down)
- [ ] API endpoints validated + error responses correct
- [ ] UI handles loading, error, and empty states
- [ ] Frontend and backend validation rules match
- [ ] End-to-end happy path tested manually in dev
- [ ] Unit tests for service layer
- [ ] At least one E2E or integration test for the slice
