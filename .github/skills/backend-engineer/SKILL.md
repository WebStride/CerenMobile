---
name: backend-engineer
description: Universal backend engineering skill covering API development, business logic, service architecture, database interaction, and security. Works across Node.js, Python, Go, Java, and any server-side stack. Query Context7 MCP for live framework-specific documentation before generating stack-specific code.
applyTo: ["**/*.ts", "**/*.js", "**/*.py", "**/*.go", "**/*.java", "**/*.rb"]
teamRole: Engineering
relatedSkills:
  - api-design
  - backend-testing
  - security-engineer
  - data-engineering
  - microservices
  - devops-engineer
expertise:
  - rest-api
  - authentication
  - database-queries
  - service-architecture
  - error-handling
  - input-validation
  - performance-optimization
---

# Backend Engineer Skill

## Role Overview
The backend engineer designs and builds the server-side of applications: APIs, business logic, database access layers, authentication, and integrations with third-party services. Responsible for correctness, security, performance, and reliability.

> **Context7 MCP**: Before writing framework-specific server code, query Context7 MCP for latest docs for the framework in use (e.g., "use context7 to get Express.js middleware docs" or "use context7 to get Fastify route schema docs").

---

## Core Responsibilities
- Design and implement RESTful or GraphQL APIs
- Write business logic cleanly separated from transport and data layers
- Implement authentication and authorization (JWT, OAuth, sessions)
- Validate and sanitize all inputs at the system boundary
- Handle errors consistently and return meaningful responses
- Optimize database queries and avoid N+1 problems
- Write unit and integration tests for all business logic
- Document APIs (OpenAPI/Swagger)

---

## Architecture Patterns

### Layered Architecture
```
Route / Controller  →  Service / Use Case  →  Repository / Data Access  →  Database
```
- **Controller**: Parse and validate request, call service, return response
- **Service**: Business logic, orchestration, no direct DB calls
- **Repository**: All DB queries isolated here — swappable for testing

### Domain-Driven Design Signals
Apply DDD when:
- Business rules are complex and change frequently
- Multiple bounded contexts exist (e.g., billing, orders, users are separate domains)
- Team is large enough to own individual domains

### CQRS
Separate read models from write models when:
- Read and write load profiles differ significantly
- Historical audit trail is required
- Event sourcing is being adopted

---

## API Design

### RESTful Conventions
```
GET    /resources          → list (paginated)
GET    /resources/:id      → single item
POST   /resources          → create
PUT    /resources/:id      → full replace
PATCH  /resources/:id      → partial update
DELETE /resources/:id      → delete
```

### Request Validation
Always validate at the boundary — never trust client input:
```typescript
// Zod (Node.js)
const schema = z.object({
  email: z.string().email(),
  amount: z.number().positive().max(1_000_000),
});
const data = schema.parse(req.body); // throws ZodError on invalid
```

### Error Response Standard
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [{ "field": "email", "message": "Invalid email format" }]
  }
}
```

### HTTP Status Code Guide
| Scenario | Code |
|----------|------|
| Success with body | 200 |
| Created | 201 |
| Success no body | 204 |
| Bad input | 400 |
| Unauthenticated | 401 |
| Forbidden | 403 |
| Not found | 404 |
| Conflict | 409 |
| Server error | 500 |

---

## Security (OWASP Top 10)

### Input Validation & Injection Prevention
- Always use parameterized queries — never string-concat SQL
- Validate and whitelist file upload types and sizes
- Sanitize HTML output if rendering user content

### Authentication
- Use short-lived JWTs (15–60 min) + refresh tokens stored as httpOnly cookies
- Never store plaintext passwords — use bcrypt/argon2 with cost factor ≥ 12
- Implement rate limiting on auth endpoints (login, register, reset)
- Multi-factor authentication for sensitive operations

### Authorization
- Check authorization on every endpoint — never rely on hiding routes
- Use role-based or attribute-based access control
- Validate resource ownership: `where id = $1 AND owner_id = $userId`

### Sensitive Data
- Never log passwords, tokens, PII, or payment data
- Encrypt PII at rest
- Use environment variables for secrets — never hardcode

### Headers (Node.js example)
```typescript
// Use helmet.js to set security headers automatically
app.use(helmet());
// CORS — restrict to known origins
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));
```

---

## Database Interaction

### Query Best Practices
- Always use an ORM or query builder with parameterized queries
- Index foreign keys and frequently filtered columns
- Use `SELECT` only needed columns — avoid `SELECT *` in production queries
- Set query timeouts to prevent runaway queries
- Use connection pooling (PgBouncer, built-in pool)

### Transactions
Use transactions for any multi-step write operation:
```typescript
await db.transaction(async (trx) => {
  await trx('orders').insert(order);
  await trx('inventory').decrement('stock', order.quantity);
});
```

### Migrations
- All schema changes via migrations — never alter production DB manually
- Migrations must be reversible (up + down)
- Test migrations against a production-sized snapshot before deploying

---

## Error Handling

### Centralized Error Handler
```typescript
// Express example
app.use((err, req, res, next) => {
  logger.error({ err, path: req.path, method: req.method });
  const status = err.statusCode ?? 500;
  res.status(status).json({
    error: {
      code: err.code ?? 'INTERNAL_ERROR',
      message: status < 500 ? err.message : 'An unexpected error occurred',
    },
  });
});
```

### Rules
- Never expose stack traces or internal error messages to clients in production
- Log full error details server-side with request context
- Use typed custom error classes for different categories

---

## Performance

### Response Time Targets
| Endpoint type | Target P99 |
|---------------|-----------|
| Simple CRUD | < 100ms |
| Complex aggregation | < 500ms |
| File upload/processing | < 3s |
| Background/async | deferred |

### Optimization Checklist
- [ ] Add DB indexes for query hot paths
- [ ] Implement caching for expensive reads (Redis, in-memory)
- [ ] Use pagination — never return unbounded lists
- [ ] Offload heavy computation to background jobs (queues)
- [ ] Enable HTTP response compression (gzip/brotli)
- [ ] Use connection pooling

---

## Testing

### Unit Tests — Service Layer
Test business logic in isolation. Mock repositories and external services:
```typescript
it('should throw when stock is insufficient', async () => {
  mockRepo.findProduct.mockResolvedValue({ stock: 0 });
  await expect(orderService.placeOrder({ productId: '1', qty: 1 }))
    .rejects.toThrow('Insufficient stock');
});
```

### Integration Tests — API Layer
Test end-to-end with real DB (test database):
```typescript
it('POST /orders returns 201', async () => {
  const res = await request(app).post('/orders').send(validOrder);
  expect(res.status).toBe(201);
  expect(res.body.id).toBeDefined();
});
```

---

## Collaboration Patterns

| Partner | When |
|---------|------|
| **api-design** | Before building any new endpoint — review contract first |
| **frontend-engineer** | When discussing request/response shapes, auth flows |
| **security-engineer** | Auth implementation, sensitive data handling, threat modeling |
| **data-engineering** | Complex queries, schema design, migration strategies |
| **backend-testing** | Test coverage strategy, mocking patterns |
| **devops-engineer** | Deployment config, environment variables, health checks |

---

## Anti-Patterns
- Putting business logic in route handlers
- Catching errors and silently swallowing them
- Returning 200 for all responses (error included)
- String-concatenated SQL queries
- Storing secrets in source code
- Blocking the event loop with synchronous heavy computation (Node.js)
- Missing authorization checks on sensitive endpoints

---

## Pre-Handoff Checklist
- [ ] All inputs validated at the boundary
- [ ] Authorization checked on every endpoint
- [ ] No sensitive data in logs or responses
- [ ] Error responses follow standard format
- [ ] Unit tests cover business logic edge cases
- [ ] Integration tests cover happy + error paths
- [ ] API documented (OpenAPI spec or equivalent)
- [ ] No N+1 queries
- [ ] Rate limiting on auth and public endpoints
- [ ] Environment variables documented in `.env.example`
