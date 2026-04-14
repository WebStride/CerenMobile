---
name: automation-testing
description: Universal test automation skill covering framework selection, CI/CD integration, page object models, API test automation, and AI-assisted test generation. Apply when building or scaling automated test suites for any stack.
applyTo: ["**/*.test.*", "**/*.spec.*", "**/tests/**", "**/e2e/**", "**/__tests__/**"]
teamRole: "QA"
relatedSkills:
  - qa-strategy
  - manual-testing
  - frontend-testing
  - backend-testing
  - devops-engineer
expertise:
  - test-framework-design
  - ci-cd-integration
  - page-object-model
  - api-automation
  - ai-assisted-testing
---

# Automation Testing Skill

## Role Overview
Automation engineers build reliable, maintainable test suites that run continuously, catch regressions early, and free the team to focus manual effort on exploratory and usability testing.

## Core Responsibilities
- Select appropriate test frameworks per layer (unit, integration, E2E)
- Build and maintain the automation test pyramid
- Integrate tests into CI/CD pipelines
- Create reusable, maintainable test utilities
- Identify manual tests as automation candidates
- Maintain test stability (minimize flakiness)
- Generate and curate AI-assisted test cases

## The Automation Pyramid

```
         ┌─────────┐
         │   E2E   │  ← Few, slow, high-value user journeys
         ├─────────┤
         │  Integ  │  ← API contracts, service integrations
         ├─────────┤
         │  Unit   │  ← Fast, numerous, business logic
         └─────────┘
```

**Rule of thumb:** 70% unit / 20% integration / 10% E2E

## Framework Selection Guide

### By Layer
| Layer | Framework Options |
|-------|-----------------|
| Unit (JS/TS) | Jest, Vitest, Mocha |
| Unit (Python) | pytest, unittest |
| Unit (Go) | testing package |
| Component | React Testing Library, Vue Test Utils |
| API | Supertest, Jest, pytest-httpx, REST-assured |
| E2E Browser | Playwright, Cypress, Selenium |
| Mobile E2E | Detox, Appium |
| Performance | k6, Locust, Artillery |

### Decision Matrix
```
Need speed + isolation → Unit tests
Need HTTP contract validation → Integration/API tests
Need real browser behavior → E2E (Playwright preferred)
Need mobile app testing → Detox (React Native) / Appium
Need load/stress testing → k6 or Locust
```

## AI-Assisted Test Generation

### GitHub Copilot Test Generation
```
// Prompt pattern for Copilot:
// "Write comprehensive unit tests for this function covering:
//  - happy path, boundary conditions, null/undefined inputs,
//  - error states, and edge cases"

// Then review: delete hallucinated tests, add domain-specific cases
```

### Playwright AI (Codegen + AI Labeling)
```bash
# Record interactions as starting point
npx playwright codegen https://your-app.com

# Then refactor into Page Object Model — never ship raw codegen output
```

### AI Test Review Checklist
- [ ] Generated tests actually test meaningful behavior
- [ ] Assertions are specific (not just `toBeTruthy()`)
- [ ] Test names describe behavior, not implementation
- [ ] No duplicate or redundant test cases
- [ ] Edge cases added beyond AI suggestions

## Page Object Model (POM) Pattern

### Structure
```
tests/
  e2e/
    pages/          ← Page Objects (selectors + actions)
      LoginPage.ts
      DashboardPage.ts
    fixtures/       ← Shared test setup
      auth.ts
    specs/          ← Test files (only assertions)
      login.spec.ts
      dashboard.spec.ts
    helpers/        ← Reusable utilities
      api.helper.ts
```

### Page Object Template
```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  // Selectors — locators only, no assertions
  get emailInput() { return this.page.getByLabel('Email') }
  get passwordInput() { return this.page.getByLabel('Password') }
  get submitButton() { return this.page.getByRole('button', { name: 'Sign In' }) }
  get errorMessage() { return this.page.getByRole('alert') }

  // Actions — composed interactions
  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}

// specs/login.spec.ts — only assertions here
test('valid credentials redirect to dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.login('user@example.com', 'password')
  await expect(page).toHaveURL('/dashboard')
})
```

## CI/CD Integration

### Pipeline Placement
```yaml
# Run in this order:
1. Lint + type-check       (fast, fail early)
2. Unit tests              (fast, run always)
3. Integration tests       (medium, run on PR)
4. E2E smoke tests         (slow, run on PR)
5. Full E2E suite          (slowest, run pre-deploy)
```

### Parallelization Strategy
```yaml
# GitHub Actions parallel matrix example
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npx playwright test --shard=${{ matrix.shard }}/4
```

### Flakiness Management
```
Rule 1: Never merge a flaky test — fix or delete it
Rule 2: Quarantine flaky tests behind a tag, investigate within 1 sprint
Rule 3: Use retries ONLY for known network timeouts (max 1 retry)
Rule 4: Track flakiness rate per test in CI dashboard
```

## API Test Automation

### API Test Structure
```typescript
describe('POST /api/orders', () => {
  test('creates order with valid payload', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({ productId: 'p1', quantity: 2 })
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      id: expect.any(String),
      status: 'pending',
    })
  })

  test('returns 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({})
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })
})
```

### Contract Testing
- Use **Pact** or **OpenAPI validation** to verify consumer-provider contracts
- Run contract tests before integration tests in CI
- Never let a breaking API change pass without a version bump

## Test Data Management

### Principles
- **Isolated** — tests create and clean up their own data
- **Deterministic** — same input always produces same test state
- **Minimal** — only create data the test actually needs
- **Independent** — test order must not matter

### Seed/Factory Pattern
```typescript
// factories/user.factory.ts
export const createUser = (overrides = {}) => ({
  id: crypto.randomUUID(),
  email: `test-${Date.now()}@example.com`,
  role: 'user',
  ...overrides,
})
```

## Collaboration Patterns

### With Manual Testing
- Automate all P0/P1 regression test cases
- Share test results with manual testers for exploratory targeting
- Coordinate on which manual tests are automation candidates

### With DevOps/CI
- Provide test run time estimates for pipeline planning
- Alert on test suite slowdowns (> 20% regression in run time)
- Agree on failure thresholds (how many failures block deploy)

### With Frontend/Backend Engineers
- Pair on fixing flaky tests caused by app-side timing issues
- Request testability hooks (data-testid, test APIs) early in development
- Add automation tests as part of PR acceptance criteria

## Test Maintenance Checklist
- [ ] All new features have corresponding automated tests
- [ ] Test run time is within agreed CI budget
- [ ] No tests marked `.skip` without a linked issue
- [ ] Flakiness rate < 1% across the suite
- [ ] Test coverage meets agreed threshold
- [ ] AI-generated tests reviewed and validated

## Anti-Patterns to Avoid
- **Testing implementation details** — test observable behavior, not internals
- **Brittle selectors** — no `div > div:nth-child(3)` — use semantic selectors
- **Sleep/hardcoded waits** — always use `waitFor` / event-based waiting
- **Shared mutable state** — tests must be independent
- **100% coverage obsession** — coverage ≠ quality; focus on meaningful assertions
- **Automating everything immediately** — prioritize flaky-prone or high-risk paths first
