---
name: backend-testing
description: Universal backend testing skill covering unit tests for business logic, integration tests for APIs and databases, contract testing, and test infrastructure patterns. Works across any server-side stack.
applyTo: ["**/*.test.ts", "**/*.test.js", "**/*.spec.ts", "**/*.spec.js", "**/*.test.py", "**/_test_*.py"]
teamRole: Engineering
relatedSkills:
  - backend-engineer
  - qa-strategy
  - api-design
  - automation-testing
  - security-testing
expertise:
  - unit-testing
  - integration-testing
  - contract-testing
  - database-testing
  - mocking
  - test-infrastructure
  - ci-testing
---

# Backend Testing Skill

## Role Overview
The backend testing engineer ensures that business logic, API contracts, and data persistence are correct and resilient. Tests should be fast, deterministic, and clearly communicate the intent of the system.

---

## Testing Strategy

```
        /\
       /e2e\         ← API smoke tests against staging
      /------\
     / contract\     ← API contract tests (Pact, OpenAPI)
    /------------\
   / integration  \  ← Full route → service → DB (test DB)
  /----------------\
 /   unit tests     \ ← Service layer, isolated, mocked deps
/--------------------\
```

---

## Unit Tests — Service Layer

Test business logic in complete isolation. Mock all I/O (DB, external APIs, email).

### Pattern
```typescript
// service.test.ts
describe('OrderService.placeOrder', () => {
  let service: OrderService;
  let mockRepo: jest.Mocked<OrderRepository>;
  let mockInventoryService: jest.Mocked<InventoryService>;

  beforeEach(() => {
    mockRepo = { create: jest.fn(), findById: jest.fn() } as any;
    mockInventoryService = { reserve: jest.fn() } as any;
    service = new OrderService(mockRepo, mockInventoryService);
  });

  it('creates order and reserves inventory', async () => {
    mockInventoryService.reserve.mockResolvedValue({ success: true });
    mockRepo.create.mockResolvedValue({ id: 'ord_1', status: 'confirmed' });

    const result = await service.placeOrder({ productId: 'p1', qty: 2 });

    expect(mockInventoryService.reserve).toHaveBeenCalledWith('p1', 2);
    expect(result.status).toBe('confirmed');
  });

  it('throws when inventory is insufficient', async () => {
    mockInventoryService.reserve.mockResolvedValue({ success: false, reason: 'out_of_stock' });

    await expect(service.placeOrder({ productId: 'p1', qty: 2 }))
      .rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
  });
});
```

### Rules for Unit Tests
- Test one behavior per test
- Arrange / Act / Assert structure
- Test both happy path and all error branches
- 100% of business logic rules should have a test

---

## Integration Tests — API Layer

Test the full stack from route to database using a real test database.

### Setup Pattern
```typescript
// test/setup.ts
import { PrismaClient } from '@prisma/client';
import { app } from '../src/app';
import request from 'supertest';

let db: PrismaClient;

beforeAll(async () => {
  db = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  await db.$connect();
});

afterEach(async () => {
  // Clean test data — order matters (FK constraints)
  await db.order.deleteMany();
  await db.product.deleteMany();
});

afterAll(async () => {
  await db.$disconnect();
});

export { app, db, request };
```

### API Integration Test Pattern
```typescript
describe('POST /orders', () => {
  it('creates order and returns 201', async () => {
    const product = await db.product.create({ data: { name: 'Widget', stock: 10 } });

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ productId: product.id, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(String),
      status: 'confirmed',
    });

    const dbOrder = await db.order.findFirst({ where: { productId: product.id } });
    expect(dbOrder).not.toBeNull();
  });

  it('returns 400 for invalid quantity', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ productId: 'p1', quantity: -1 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/orders').send({ productId: 'p1', quantity: 1 });
    expect(res.status).toBe(401);
  });
});
```

---

## Database Tests

### Test Isolation Strategies
| Strategy | Speed | Use When |
|----------|-------|----------|
| `deleteMany` after each test | Fast | Small datasets, simple schema |
| Transactions + rollback | Fastest | Read-heavy, no DDL changes |
| Full DB reset between suites | Slow | Complex schema, migrations being tested |

### Testing Migrations
```bash
# Always test migrations against a copy of production schema
pg_dump $PROD_DB --schema-only > /tmp/prod-schema.sql
psql $TEST_DB < /tmp/prod-schema.sql
npx prisma migrate deploy  # apply pending migrations to test DB
```

### Repository Layer Tests
Test repository functions directly against test DB — verify ORM behavior:
```typescript
it('findByStatus returns only matching orders', async () => {
  await db.order.createMany({ data: [
    { status: 'pending', ... },
    { status: 'confirmed', ... },
  ]});

  const result = await orderRepository.findByStatus('pending');
  expect(result).toHaveLength(1);
  expect(result[0].status).toBe('pending');
});
```

---

## Contract Testing

Use contract tests to ensure frontend and backend agree on API shape. This prevents integration failures after independent deployments.

### OpenAPI Contract Validation
```typescript
import { validate } from 'openapi-response-validator';

it('GET /products matches OpenAPI spec', async () => {
  const res = await request(app).get('/products');
  const errors = validate(res.body, schema.paths['/products'].get.responses['200']);
  expect(errors).toHaveLength(0);
});
```

### Pact (Consumer-Driven Contract Testing)
Use Pact when services are independently deployed (microservices, separate frontend/backend teams):
1. Consumer (frontend) defines expected API interactions
2. Pact publishes the contract
3. Provider (backend) verifies the contract on each build

---

## Mocking External Services

### External APIs (HTTP)
```typescript
import nock from 'nock';

it('sends email on order confirmation', async () => {
  const emailMock = nock('https://api.sendgrid.com')
    .post('/v3/mail/send')
    .reply(202);

  await orderService.confirmOrder('ord_1');

  expect(emailMock.isDone()).toBe(true);  // verify call was made
});
```

### Time-Dependent Logic
```typescript
jest.useFakeTimers();
jest.setSystemTime(new Date('2024-01-15'));

it('creates order with correct timestamp', async () => {
  const order = await orderService.create(data);
  expect(order.createdAt).toEqual(new Date('2024-01-15'));
});

afterEach(() => jest.useRealTimers());
```

---

## Security Testing in Integration Tests

Always test security boundaries:
```typescript
describe('Authorization', () => {
  it('cannot access another user\'s order', async () => {
    const otherUserOrder = await createOrderForUser(otherUserId);
    
    const res = await request(app)
      .get(`/orders/${otherUserOrder.id}`)
      .set('Authorization', `Bearer ${currentUserToken}`);
    
    expect(res.status).toBe(403);
  });

  it('rejects SQL injection attempts', async () => {
    const res = await request(app)
      .get('/users?search=' + encodeURIComponent("'; DROP TABLE users; --"));
    
    expect(res.status).not.toBe(500);  // Does not crash
    expect(res.body.data).toEqual([]);  // Returns empty, not all users
  });
});
```

---

## CI Integration

```yaml
jobs:
  backend-tests:
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
    steps:
      - run: npm run test:unit       # Fast — no DB
      - run: npm run test:integration # Uses test DB service
      - run: npm run test:coverage   # Report coverage
```

---

## Coverage Targets

| Layer | Target |
|-------|--------|
| Service (business logic) | 90%+ |
| Repository functions | 80%+ |
| API routes (integration) | 80%+ |
| Error paths | 100% of defined error codes |

---

## Collaboration Patterns

| Partner | When |
|---------|------|
| **backend-engineer** | Define what tests are required alongside each feature |
| **api-design** | Use API spec as the source of truth for contract tests |
| **qa-strategy** | Align on coverage goals and risk-based test prioritization |
| **security-testing** | Cover OWASP-relevant test cases (auth, injection, access control) |
| **devops-engineer** | Integrate tests into CI/CD pipeline |

---

## Anti-Patterns
- Testing only the happy path
- Using production database for tests
- Tests that depend on execution order
- Mocking your own code (mock external deps only)
- Slow tests due to unnecessary real network calls
- Non-deterministic tests (flaky timing, random data without seeding)

---

## Pre-Handoff Checklist
- [ ] Unit tests for all service methods and edge cases
- [ ] Integration test for every API endpoint (happy + error paths)
- [ ] Authorization boundary tests (401, 403 cases)
- [ ] Test database setup is reproducible and isolated
- [ ] All tests pass in CI
- [ ] Coverage report meets targets
- [ ] External service calls are mocked in tests
