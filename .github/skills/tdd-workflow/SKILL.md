---
name: tdd-workflow
description: 'Use this skill when writing new features, fixing bugs, or refactoring code. Enforces the Red-Green-Refactor TDD cycle: write failing tests first, then implement just enough code to pass them, then refactor. Works for any stack — React Native, Node.js, TypeScript, Prisma. Guarantees minimum 80% test coverage before any code is merged.'
argument-hint: 'Which feature, bug fix, or refactor are you working on?'
origin: ECC
---

# TDD Workflow — Red-Green-Refactor Cycle

**Applies to:** Any stack — React Native, Expo, Node.js, TypeScript, Prisma, MySQL  
**Trigger:** ALWAYS activate before writing any new feature, fixing a bug, or refactoring code.

> "Never write a line of production code unless it is to make a failing test pass." — Kent Beck

---

## When to Activate

- Starting a new feature screen or component
- Fixing a bug (write a test that reproduces the bug first)
- Refactoring existing code
- Adding a new API endpoint
- Modifying database schema or Prisma queries

---

## Core Principles

1. **Red first** — Write a test that fails before writing any implementation code
2. **Green minimum** — Write only the smallest amount of code to pass the test
3. **Refactor safely** — Clean up code only when tests are green
4. **Coverage gate** — Minimum 80% coverage before merging
5. **Test the behavior, not the implementation** — Tests should describe WHAT, not HOW

---

## Steps

### Step 1 — Write User Journeys (Before Any Code)

Describe the feature in plain-language user journeys:
```
GIVEN a logged-in user
WHEN they tap "Add to Cart" on a product
THEN the cart count increments by 1
AND the product appears in the cart screen
```

Write one journey per acceptance criterion. These become your test cases.

### Step 2 — Generate Test Cases

Convert each user journey into a test:
```typescript
// React Native / Jest
describe('Cart - Add Product', () => {
  it('should increment cart count when product is added', async () => {
    // Arrange
    const { getByTestId } = render(<ProductCard product={mockProduct} />);
    
    // Act
    fireEvent.press(getByTestId('add-to-cart-button'));
    
    // Assert
    expect(getByTestId('cart-count')).toHaveTextContent('1');
  });
});
```

For backend (Node.js/Express):
```typescript
describe('POST /cart/add', () => {
  it('should add product to cart and return updated cart', async () => {
    const res = await request(app)
      .post('/cart/add')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ productId: 'PROD001', quantity: 1 });
    
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });
});
```

### Step 3 — Run Tests (RED Phase)

```bash
# Run tests — they MUST fail at this point
cd MobileAppUI && npx jest --testPathPattern=cart
cd backend && npx jest --testPathPattern=cart

# Confirm: tests fail with meaningful error messages
# NOT because of syntax errors — because the implementation doesn't exist yet
```

**STOP if tests pass at this point** — your test is not testing anything real.

### Step 4 — Implement Code (GREEN Phase)

Write the minimum code required to make each failing test pass:
- No extra logic
- No premature optimization
- No handling of edge cases not covered by a test
- One test → one implementation unit

Run tests after each small increment:
```bash
npx jest --watch --testPathPattern=cart
```

### Step 5 — Run Tests Again (GREEN Confirmation)

```bash
# All tests must be GREEN before proceeding to refactor
npx jest --testPathPattern=cart --verbose
```

If any test is still red: fix the implementation, NOT the test.

### Step 6 — Refactor (with Tests as Safety Net)

Improve the implementation while keeping all tests green:
- Extract repeated logic into shared utilities
- Improve naming and readability
- Remove duplication
- Apply project coding standards

After every refactor step:
```bash
npx jest --testPathPattern=cart
# Must stay green throughout
```

### Step 7 — Verify Coverage (Minimum 80%)

```bash
# Check coverage for the changed files
npx jest --coverage --testPathPattern=cart

# Minimum thresholds:
# - Statements: 80%
# - Branches: 80%
# - Functions: 80%
# - Lines: 80%
```

If coverage is below 80%, identify uncovered branches and add tests for them.

### Step 8 — Integration Test

Write at least one integration test that covers the full flow end-to-end:
- Mobile: screen render → user interaction → API call → state update
- Backend: HTTP request → middleware → controller → service → database → response

---

## Project-Specific Commands

```bash
# Mobile tests
cd MobileAppUI && npx jest
cd MobileAppUI && npx jest --coverage
cd MobileAppUI && npx jest --watch

# Backend tests
cd backend && npx jest
cd backend && npx jest --coverage
cd backend && npx jest --watch

# Run all tests
npx jest --all
```

---

## Test File Naming Convention

```
# Mobile components
MobileAppUI/app/(tabs)/__tests__/HomeScreen.test.tsx
MobileAppUI/components/__tests__/QuantitySelector.test.tsx

# Backend
backend/src/controllers/__tests__/cart.test.ts
backend/src/services/__tests__/orderService.test.ts
```

---

## Verification Checklist

- [ ] Tests written BEFORE implementation (Red phase confirmed)
- [ ] All tests pass (Green phase confirmed)
- [ ] Code refactored and clean (Refactor phase confirmed)
- [ ] Coverage ≥ 80% for changed files
- [ ] Integration test covers the happy path
- [ ] Edge cases tested (null inputs, network errors, empty states)
- [ ] No test was modified to make it pass (only implementation)
