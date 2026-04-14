---
name: frontend-testing
description: Universal frontend testing skill covering unit tests, component tests, integration tests, E2E tests, visual regression, and accessibility testing. Framework-agnostic patterns for React, Vue, Svelte, and Angular.
applyTo: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx", "**/*.test.js", "**/*.spec.js"]
teamRole: Engineering
relatedSkills:
  - frontend-engineer
  - qa-strategy
  - automation-testing
  - accessibility-design
expertise:
  - unit-testing
  - component-testing
  - e2e-testing
  - visual-regression
  - accessibility-testing
  - test-coverage
  - ci-integration
---

# Frontend Testing Skill

## Role Overview
The frontend testing engineer ensures UI components, user flows, and integrations are reliable through automated tests. Responsible for defining what to test, how to test it, and ensuring the test suite runs fast and fails clearly.

---

## Testing Pyramid for Frontend

```
          /\
         /E2E\          ← few, slow, high confidence (Playwright/Cypress)
        /------\
       / Integ  \       ← moderate, test component + API together
      /----------\
     /  Component \     ← many, fast, test single components
    /--------------\
   /   Unit Tests   \   ← most, fastest, logic/utilities/hooks
  /------------------\
```

### When to use each level
| Level | Use For |
|-------|---------|
| Unit | Pure functions, custom hooks, utilities, formatters |
| Component | Individual components with mocked deps |
| Integration | Multi-component flows, forms with submission |
| E2E | Critical user journeys (login, checkout, onboarding) |

---

## Unit Tests — Utilities & Hooks

### Testing Pure Functions
```typescript
import { formatCurrency } from '../utils/currency';

it('formats positive amounts correctly', () => {
  expect(formatCurrency(1000, 'INR')).toBe('₹1,000.00');
});

it('handles zero', () => {
  expect(formatCurrency(0, 'INR')).toBe('₹0.00');
});
```

### Testing Custom Hooks (React)
```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../hooks/useCounter';

it('increments count', () => {
  const { result } = renderHook(() => useCounter());
  act(() => { result.current.increment(); });
  expect(result.current.count).toBe(1);
});
```

---

## Component Tests

### Guiding Principles
- Test behavior, not implementation details
- Query by ARIA role/label (how users find things), not by CSS classes
- Avoid `getByTestId` unless absolutely no semantic alternative exists

### React Testing Library Pattern
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

it('calls onSubmit with email and password', async () => {
  const onSubmit = jest.fn();
  render(<LoginForm onSubmit={onSubmit} />);
  
  await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
    });
  });
});
```

### Mocking API Calls
Use `msw` (Mock Service Worker) to intercept requests at the network level:
```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/user', () => HttpResponse.json({ name: 'Alice' }))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('displays user name from API', async () => {
  render(<UserProfile />);
  expect(await screen.findByText('Alice')).toBeInTheDocument();
});
```

---

## Integration Tests

### Form Submission Flow
Test the complete form experience including API interaction:
```typescript
it('submits form and shows success message', async () => {
  server.use(
    http.post('/api/orders', () => HttpResponse.json({ id: '123' }, { status: 201 }))
  );
  
  render(<OrderForm />);
  await userEvent.type(screen.getByLabelText(/product name/i), 'Widget');
  await userEvent.type(screen.getByLabelText(/quantity/i), '5');
  await userEvent.click(screen.getByRole('button', { name: /place order/i }));
  
  expect(await screen.findByText(/order placed successfully/i)).toBeInTheDocument();
});
```

---

## E2E Tests (Playwright)

### Page Object Model
```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}
  
  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }
}

// tests/login.spec.ts
test('user can log in', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login('user@example.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

### Critical User Journeys to Always Cover
- Authentication (login, logout, session expiry)
- Primary create flow (the core action of the product)
- Checkout/payment flow (if applicable)
- Error recovery flows (what happens when API fails)

---

## Visual Regression Tests

Use Chromatic (Storybook) or Playwright screenshots:
```typescript
test('renders checkout page', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page).toHaveScreenshot('checkout.png', {
    maxDiffPixelRatio: 0.01,
  });
});
```
- Run visual tests only for stable, fully-designed components
- Always review screenshot diffs in CI — failing visual tests ≠ broken

---

## Accessibility Testing

### Automated (axe-core)
```typescript
import { checkA11y } from 'axe-playwright';

test('checkout page has no accessibility violations', async ({ page }) => {
  await page.goto('/checkout');
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});
```

### Manual Checklist
- [ ] Keyboard navigation works (Tab order is logical, no focus traps)
- [ ] Screen reader announces form errors
- [ ] Color contrast ≥ 4.5:1 for normal text
- [ ] All images have meaningful alt text or `alt=""`
- [ ] Interactive elements have ARIA labels if text is unclear

---

## Test Coverage

### Coverage Targets
| Layer | Target |
|-------|--------|
| Utilities / hooks | 90%+ |
| Form components | 80%+ |
| Critical flows | 100% E2E |
| Display-only components | don't over-test |

### What NOT to test
- Implementation details (internal state, private methods)
- Framework behavior (React renders, router navigation internals)
- Third-party library code
- Simple display components with no logic

---

## CI Integration

### Recommended Pipeline
```yaml
jobs:
  test:
    steps:
      - run: npm run test:unit         # Jest — fast, run always
      - run: npm run test:component    # RTL — fast, run always
      - run: npm run test:e2e          # Playwright — slower, run on PR
      - run: npm run test:a11y         # axe — run on PR
```

---

## Collaboration Patterns

| Partner | When |
|---------|------|
| **frontend-engineer** | Define what tests to add alongside each feature |
| **qa-strategy** | Align on E2E coverage gaps and test ownership |
| **automation-testing** | Share Playwright/Cypress patterns and CI setup |
| **accessibility-design** | Define a11y acceptance criteria before testing |

---

## Anti-Patterns
- Testing implementation details (testing that `setState` was called)
- `getByTestId` for everything — prefer semantic queries
- Single monolithic E2E test for all scenarios
- Not cleaning up mocks/handlers between tests
- Skipping error state tests — happy path only

---

## Pre-Handoff Checklist
- [ ] Unit tests for all utility functions and custom hooks
- [ ] Component tests for all interactive components
- [ ] Integration test for each form/multi-step flow
- [ ] E2E test for primary user journey
- [ ] Accessibility test passes (axe-core, no violations)
- [ ] All tests pass in CI
