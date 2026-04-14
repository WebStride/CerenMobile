---
name: qa-strategy
description: Universal QA strategy skill covering test planning, coverage goals, risk-based testing, quality gates, AI-assisted test automation, and team-wide quality culture. Apply when defining testing approach for a feature, sprint, or project. Includes AI-assisted automation with Playwright AI and Copilot test generation.
applyTo: ["**/*"]
teamRole: "QA"
relatedSkills:
  - manual-testing
  - automation-testing
  - performance-testing
  - security-testing
  - backend-testing
  - frontend-testing
expertise:
  - Test planning
  - Risk-based testing
  - Quality gates and metrics
  - AI-assisted automation
  - Shift-left testing strategy
---

# QA Strategy Skill

## Role Overview
Define and own the quality strategy for the product. QA is not a gate at the end — it is a discipline woven into every stage of development, from requirements review to production monitoring.

## Core Responsibilities
- Define test strategy and coverage goals per release/sprint
- Identify high-risk areas and prioritize testing accordingly
- Establish quality gates for CI/CD pipelines
- Champion shift-left testing practices (test as early as possible)
- Select and maintain test tooling and frameworks
- Track and report quality metrics (defect density, coverage, MTTR)
- Build AI-assisted automation capabilities

## Testing Pyramid

```
         /\
        /  \  E2E Tests (10%)
       /    \  — Playwright, Cypress
      /      \  — Critical user journeys only
     /--------\
    /          \  Integration Tests (30%)
   /            \  — API contracts, DB, service interactions
  /              \
 /----------------\
/                  \  Unit Tests (60%)
                      — Business logic, utilities, components
                      — Fast, isolated, numerous
```

### Coverage Targets by Layer
| Layer | Target Coverage | Tools |
|-------|----------------|-------|
| Unit tests | ≥ 80% line coverage | Jest, Vitest, pytest, go test |
| Integration tests | All API endpoints | Supertest, REST Assured, Postman |
| E2E tests | Top 10 user journeys | Playwright, Cypress |
| Visual regression | Core UI components | Chromatic, Percy |

## Risk-Based Testing Approach

### Risk Matrix
Plot features on **Likelihood of Failure × Impact of Failure**:

| Zone | Strategy |
|------|----------|
| High likelihood + High impact | Full automation + manual exploratory |
| Low likelihood + High impact | Automated smoke + manual edge cases |
| High likelihood + Low impact | Automated regression |
| Low likelihood + Low impact | Spot-check only |

### High-Risk Areas (Prioritize Always)
- Authentication and authorization
- Payment and financial calculations
- Data migrations and schema changes
- Third-party integrations
- Complex state machines
- New features in legacy code without tests
- Performance-critical paths

## Quality Gates (CI/CD)

### PR-Level Gates
- [ ] All unit tests pass
- [ ] Code coverage meets threshold (configurable, typically 80%)
- [ ] No new linting errors
- [ ] No new accessibility violations (axe-core)
- [ ] Type checking passes (tsc --noEmit)

### Staging Gates
- [ ] All integration tests pass
- [ ] E2E smoke suite passes (top 5 journeys)
- [ ] No performance regression (Core Web Vitals within 10% of baseline)
- [ ] Security scan passes (Snyk, OWASP dependency check)

### Production Release Gates
- [ ] Full E2E regression suite passes
- [ ] Load test baseline met
- [ ] Accessibility audit clean
- [ ] Rollback plan documented and tested

## AI-Assisted Test Automation

### GitHub Copilot for Test Generation
```
Prompt pattern: "Write a comprehensive test suite for [function/component name].
Cover: happy path, edge cases, error states, boundary values.
Use [Jest/Vitest/Playwright] with [Testing Library / supertest]."
```

### Playwright AI / Codegen
```bash
# Record interactions to generate Playwright test code
npx playwright codegen https://localhost:3000

# Use AI to generate test from description
npx playwright test --ui   # Visual test explorer
```

### Copilot-Assisted Test Review
- Ask Copilot: "What test cases am I missing for this function?"
- Ask Copilot: "Generate boundary value and equivalence partition test cases"
- Ask Copilot: "Convert this manual test case to Playwright automation"

### AI-Assisted Visual Testing
- Use Chromatic + Storybook: Auto-detect visual regressions with AI diffing
- Use Percy: Smart visual comparison that ignores dynamic content

### Caution with AI-Generated Tests
- Always review AI-generated tests for correctness
- AI tends to test implementation, not behavior — redirect to behavior-focused tests
- Verify edge cases are actually covered, not just mentioned

## Test Planning Template

### Per Feature/Sprint
```
Feature: [Name]
Risk Level: [High / Medium / Low]
Owner: [QA engineer or developer]

Unit Tests:
  - [ ] [Function/component] → [behavior to test]

Integration Tests:
  - [ ] [API endpoint] → [expected contract]

E2E Tests:
  - [ ] [User journey] → [expected outcome]

Manual Exploratory:
  - [ ] [Area to explore] → [session duration]

Not Testing (and why):
  - [Excluded area] — [reason]
```

## Shift-Left Practices
- QA reviews requirements/designs for testability before development starts
- Developers write unit tests as part of Definition of Done
- Feature flags enable testing in production without full release
- Contract testing catches integration issues before E2E tests
- QA pairs with developers on complex features during implementation

## Quality Metrics to Track

| Metric | Target | Frequency |
|--------|--------|-----------|
| Test pass rate | > 99% in CI | Per commit |
| Code coverage | ≥ 80% unit, 100% critical paths | Per PR |
| Mean time to detect (MTTD) | < 1 day | Weekly |
| Mean time to resolve (MTTR) | < 2 days (p2+) | Weekly |
| Escaped defects | ≤ 2 per release | Per release |
| Test execution time | < 10min CI, < 30min full suite | Per sprint |

## Definition of Done (DoD) — QA Perspective
A feature is done when:
- [ ] Unit tests written and passing
- [ ] Integration tests covering all new API contracts
- [ ] E2E test added if feature adds a new user journey
- [ ] Accessibility passing (automated)
- [ ] Code reviewed by at least one other engineer
- [ ] QA sign-off on acceptance criteria
- [ ] Deployed to staging and smoke-tested

## Anti-Patterns
- "We'll add tests later" — technical debt that never gets paid
- Testing only the happy path
- Flaky tests not fixed immediately (erode trust in the suite)
- Testing implementation details instead of behavior
- QA as final gatekeeper with no early involvement
- 100% code coverage at the expense of meaningful tests
- Manual regression for things that can be automated

## Collaboration Patterns
- **With Frontend Engineer**: Define component test contracts; review coverage together
- **With Backend Engineer**: Define integration test contracts; share test data setup
- **With Product Manager**: Translate acceptance criteria into test cases; flag untestable requirements
- **With DevOps**: Configure quality gates in CI pipeline; set up test reporting dashboards
- **With Security Team**: Coordinate SAST/DAST scan integration in pipeline

## Pre-Sprint QA Checklist
- [ ] Risk assessment completed for all features in sprint
- [ ] Test cases written (or started) before development begins
- [ ] Test environments confirmed and stable
- [ ] Test data requirements identified
- [ ] Automation candidates identified
- [ ] Definition of Done agreed with team
