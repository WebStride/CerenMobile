---
name: manual-testing
description: Universal manual testing skill covering exploratory testing, test case design, regression testing, bug reporting, and usability evaluation. Apply when planning or executing manual test cycles for any application.
applyTo: ["**/*"]
teamRole: "QA"
relatedSkills:
  - qa-strategy
  - automation-testing
  - frontend-engineer
  - backend-engineer
  - ux-design
expertise:
  - exploratory-testing
  - test-case-design
  - regression-testing
  - bug-reporting
  - usability-testing
---

# Manual Testing Skill

## Role Overview
Manual testers validate software quality through human-driven exploration, structured test execution, and subjective experience evaluation — catching issues that automated tools miss.

## Core Responsibilities
- Design and maintain test cases aligned to acceptance criteria
- Execute exploratory and scripted test sessions
- Perform regression testing before releases
- Evaluate UX and usability qualitatively
- File detailed, reproducible bug reports
- Validate bug fixes and close defect loops
- Collaborate with developers on edge cases

## Test Design Principles

### Test Case Structure
Every test case must include:
```
ID: TC-[MODULE]-[NUMBER]
Title: One-line description
Preconditions: System state required before test
Steps: Numbered, atomic actions
Expected Result: Observable, specific outcome
Actual Result: (filled during execution)
Status: Pass / Fail / Blocked / Skip
Priority: Critical / High / Medium / Low
```

### Coverage Categories
| Category | What to Test |
|----------|-------------|
| Functional | Does the feature work as specified? |
| Boundary | Inputs at min/max/zero/null |
| Negative | Invalid inputs, error states |
| Integration | Cross-feature and cross-service flows |
| Regression | Previously broken scenarios |
| Usability | Is it intuitive, accessible, frustration-free? |

## Exploratory Testing

### Charter-Based Exploration
```
Charter: Explore [area] with [data/conditions] to discover [risks]

Example:
Explore the checkout flow with expired payment cards
to discover error handling and recovery paths
```

### Session Structure
1. **Define charter** — what area + what risks to probe
2. **Timebox** — 45–90 minute focused sessions
3. **Note observations** — bugs, questions, inconsistencies
4. **Debrief** — summarize findings, open bugs, coverage

### High-Value Exploratory Areas
- Boundary conditions and edge cases
- Error states and recovery flows
- Permission and role boundaries
- Data integrity after partial failures
- Concurrent user actions
- State transitions (loading → success → error → retry)

## Regression Testing

### Regression Scope Decision
```
Change Type         → Regression Scope
─────────────────────────────────────
Bug fix             → Affected module + smoke
New feature         → New feature + related modules
Refactor            → Full affected service
DB migration        → All data-dependent flows
Auth change         → All authenticated flows
```

### Smoke Test Checklist (run every build)
- [ ] App loads without console errors
- [ ] Core user journey completes (sign in → primary action)
- [ ] Critical API endpoints return expected responses
- [ ] No broken navigation or dead links
- [ ] Key forms submit and validate correctly

## Bug Reporting Standards

### Bug Report Template
```
Title: [Component] [Action] [Unexpected Outcome]
Example: "Checkout form submits with empty required fields"

Environment:
  - Browser / OS / Device
  - App version / build
  - User role / account state

Severity: Critical | High | Medium | Low
Priority: P0 | P1 | P2 | P3

Steps to Reproduce:
  1. Go to...
  2. Click...
  3. Enter...
  4. Observe...

Expected: [What should happen]
Actual: [What actually happens]

Screenshots/Video: [attach]
Console Errors: [paste]
Network Requests: [if relevant]
```

### Severity Classification
| Level | Definition | Example |
|-------|-----------|---------|
| Critical | Blocks core functionality, data loss risk | Login fails for all users |
| High | Major feature broken, workaround needed | Payment doesn't process |
| Medium | Feature partially broken | Filter shows wrong results |
| Low | Minor cosmetic/UX issue | Button misaligned on mobile |

## Usability Testing

### Heuristic Evaluation (Nielsen's 10)
- **Visibility** — Is system status always clear?
- **Match** — Does it match real-world conventions?
- **Control** — Can users undo/redo freely?
- **Consistency** — Same actions = same outcomes?
- **Error prevention** — Does the UI prevent mistakes?
- **Recognition** — Minimize memory load on users
- **Flexibility** — Expert shortcuts available?
- **Minimalism** — No irrelevant information?
- **Recovery** — Clear error messages and paths?
- **Help** — Documented and accessible help?

### Usability Session Script
```
1. Introduce the session, explain it's testing the product not the user
2. Give scenario: "You are [persona], you need to [goal]"
3. Ask them to think aloud while acting
4. Observe: hesitations, errors, confusion points
5. Debrief: what was easy? what was confusing?
```

## Collaboration Patterns

### With Frontend Engineers
- Share failing test cases + screenshots
- Confirm fix scope before re-testing
- Provide browser-specific reproduction steps

### With Backend Engineers
- Include request/response payloads in API bug reports
- Confirm whether issue is UI or API layer
- Validate error messages match API error codes

### With QA Strategy
- Align test cases to acceptance criteria from `qa-strategy`
- Feed manual findings into automation candidates list
- Report coverage gaps to QA lead

### With UX Designers
- Validate designs match implementation
- Report usability issues found during testing
- Participate in usability sessions as observer

## Release Testing Checklist
- [ ] All P0/P1 test cases passed
- [ ] No open Critical/High bugs
- [ ] Regression suite executed on staging
- [ ] New feature test cases 100% executed
- [ ] Exploratory session completed on changed areas
- [ ] Mobile/responsive tested if UI changed
- [ ] Accessibility spot-check completed

## Anti-Patterns to Avoid
- **Testing happy paths only** — always explore error and edge paths
- **Vague bug reports** — "it doesn't work" is not a bug report
- **Untimed exploratory sessions** — always timebox to stay focused
- **Skipping reproductions steps** — every bug must be reproducible
- **Retesting in wrong environment** — always match original bug environment
- **Manual-only mindset** — flag high-repetition tests as automation candidates

## Tools Reference (Universal)
| Type | Examples |
|------|---------|
| Test management | TestRail, Zephyr, Notion, Linear |
| Bug tracking | Jira, GitHub Issues, Linear |
| Screen recording | Loom, CloudApp, built-in OS tools |
| Browser DevTools | Chrome DevTools, Firefox DevTools |
| API testing | Postman, Insomnia, curl |
| Accessibility | axe DevTools, Lighthouse, NVDA |
