---
name: api-design
description: Universal API design skill covering RESTful design, GraphQL, versioning, documentation, error standards, pagination, and authentication patterns. Apply before building any new API or modifying existing contracts.
applyTo: ["**/routes/**", "**/controllers/**", "**/resolvers/**", "**/api/**", "**/*.schema.ts", "**/*.schema.js", "**/openapi.yaml", "**/swagger.json"]
teamRole: Engineering
relatedSkills:
  - backend-engineer
  - frontend-engineer
  - security-engineer
  - backend-testing
  - microservices
expertise:
  - rest-design
  - graphql
  - openapi-spec
  - versioning
  - pagination
  - rate-limiting
  - api-security
  - documentation
---

# API Design Skill

## Role Overview
The API designer defines the contract between clients and services. Responsible for intuitive, consistent, secure, and evolvable APIs that minimize breaking changes and are well-documented.

> **Read before writing any new endpoint**: Good API design is a contract. Changing it after clients depend on it is painful. Design carefully upfront.

---

## RESTful Design Principles

### Resource Naming
```
# Good — nouns, lowercase, hyphen-separated
GET  /purchase-orders
GET  /purchase-orders/:id
POST /purchase-orders
PATCH /purchase-orders/:id
DELETE /purchase-orders/:id

# Actions as sub-resources for non-CRUD operations
POST /purchase-orders/:id/approve
POST /purchase-orders/:id/cancel
POST /users/:id/reset-password

# Bad — verbs in path
GET /getPurchaseOrders
POST /createOrder
```

### HTTP Method Semantics
| Method | Semantics | Idempotent | Body |
|--------|-----------|-----------|------|
| GET | Read | Yes | No |
| POST | Create / Action | No | Yes |
| PUT | Full Replace | Yes | Yes |
| PATCH | Partial Update | No (usually) | Yes |
| DELETE | Remove | Yes | Optional |

### Nested Resources — Limit to 2 Levels
```
# Good — 2 levels max
GET /suppliers/:id/invoices
GET /suppliers/:id/invoices/:invoiceId

# Avoid deep nesting — complexity explodes
GET /companies/:id/suppliers/:sid/invoices/:iid/line-items/:lid  # too deep
# Instead:
GET /invoices/:iid/line-items/:lid  # flatten with query params for filtering
```

---

## Request & Response Standards

### Consistent Response Envelope

**Success (list)**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 142,
    "hasNextPage": true
  }
}
```

**Success (single item)**
```json
{
  "data": {
    "id": "ord_abc123",
    "status": "confirmed",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "quantity", "message": "Must be a positive integer" },
      { "field": "price", "message": "Required" }
    ],
    "requestId": "req_xyz789"
  }
}
```

### Error Code System
Define a finite list of machine-readable error codes:
```
VALIDATION_ERROR      — Client sent invalid data
NOT_FOUND             — Resource doesn't exist
UNAUTHORIZED          — Not authenticated
FORBIDDEN             — Authenticated but not authorized
CONFLICT              — State conflict (duplicate, concurrent edit)
RATE_LIMITED          — Too many requests
INTERNAL_ERROR        — Server-side unexpected error
```

---

## Pagination

### Cursor-Based (preferred for large/live datasets)
```
GET /transactions?cursor=eyJpZCI6MTAwfQ&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6MTIwfQ",
    "hasNextPage": true
  }
}
```

### Offset-Based (simpler, for small/static datasets)
```
GET /products?page=2&pageSize=20

Response:
{
  "data": [...],
  "pagination": { "page": 2, "pageSize": 20, "total": 200 }
}
```

**Never** return unbounded lists. Always paginate.

---

## Filtering, Sorting, and Field Selection

```
# Filtering — use query parameters
GET /transactions?status=completed&startDate=2024-01-01&endDate=2024-01-31

# Sorting — field and direction
GET /products?sort=price&order=asc
GET /orders?sort=createdAt&order=desc

# Field selection (reduces payload size)
GET /users?fields=id,name,email
```

---

## Versioning Strategy

### URL Versioning (most explicit, recommended for public APIs)
```
/api/v1/orders
/api/v2/orders
```

### Header Versioning (cleaner URLs, harder to test manually)
```
GET /api/orders
Accept-Version: v2
```

### Versioning Rules
- **Never** break existing clients without a new version
- Deprecate before removing — add `Deprecation` header
- Support at least 2 major versions simultaneously during transition
- Document what changed between versions

### Backwards-Compatible Changes (no version bump needed)
- Adding new optional fields to responses
- Adding new optional query parameters
- Adding new endpoints
- Adding new enum values to existing fields (risky — test consumers)

### Breaking Changes (require new version)
- Removing or renaming fields
- Changing field types
- Changing HTTP method or URL
- Changing error code structure

---

## Authentication & Authorization Headers

### Bearer Token (JWT)
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### API Key
```
X-API-Key: ak_live_abc123xyz
```

### Core Rules
- HTTPS only on all authenticated endpoints
- Tokens should be short-lived (15–60 min)
- Never pass tokens in URL query parameters (they appear in logs)
- Rate limit authentication endpoints aggressively

---

## Rate Limiting

### Response Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705312800
Retry-After: 60  (only on 429 response)
```

### Strategy by Endpoint Type
| Type | Limit |
|------|-------|
| Read endpoints | 1000 req/min |
| Write endpoints | 100 req/min |
| Auth endpoints | 10 req/min |
| File upload | 10 req/min |

---

## OpenAPI Documentation

Every API must have an OpenAPI 3.x spec. Generate from code annotations or maintain as source of truth:

```yaml
openapi: 3.0.3
info:
  title: Orders API
  version: 1.0.0
paths:
  /orders:
    post:
      summary: Create order
      tags: [Orders]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateOrderRequest'
      responses:
        '201':
          description: Order created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'
```

### Documentation Checklist
- [ ] Every endpoint has a summary and description
- [ ] All parameters documented with type and constraints
- [ ] All response codes documented (200, 201, 400, 401, 403, 404, 500)
- [ ] Request/response schemas fully defined
- [ ] Authentication scheme documented
- [ ] Example values provided for all schemas

---

## Webhooks Design

When your API needs to push events to clients:

```
POST https://client-endpoint.com/webhooks
Content-Type: application/json
X-Signature-SHA256: sha256=<HMAC of body>

{
  "event": "order.confirmed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": { "orderId": "ord_abc123", "status": "confirmed" }
}
```

Rules:
- Always include HMAC signature for verification
- Use noun.verb event naming: `user.created`, `payment.failed`
- Retry failed deliveries with exponential backoff
- Document event catalog alongside API docs

---

## Collaboration Patterns

| Partner | When |
|---------|------|
| **frontend-engineer** | Review API contract before building UI — agree on shape first |
| **backend-engineer** | Implement the agreed contract |
| **backend-testing** | Write contract tests against the OpenAPI spec |
| **security-engineer** | Review auth, rate limiting, and data exposure |
| **microservices** | Service-to-service API contracts |

---

## Anti-Patterns
- Verbs in resource URLs (`/getUser`, `/createOrder`)
- Returning 200 for errors
- No pagination on list endpoints
- Inconsistent field naming (camelCase + snake_case mixed)
- Breaking changes without version bump
- No rate limiting on public or auth endpoints
- Undocumented endpoints shipped to production

---

## Pre-Handoff Checklist
- [ ] Resource naming follows noun convention
- [ ] HTTP methods used semantically
- [ ] All responses follow error envelope standard
- [ ] All list endpoints are paginated
- [ ] Filtering and sorting documented
- [ ] Rate limiting implemented and documented
- [ ] Auth mechanism specified and tested
- [ ] OpenAPI spec complete and validates
- [ ] No breaking changes to existing contracts (or version bumped)
