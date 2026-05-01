---
name: gateguard
description: 'Quality gate enforcer before every commit or push. Aggregates all verification loops: TypeScript errors, lint, tests, security, API contract, and mobile build health. Use before every git push, PR creation, or release candidate to ensure nothing broken gets merged to main.'
argument-hint: 'What are you about to push/merge? (feature, hotfix, release, migration, API change)'
origin: ECC
---

# GateGuard — Quality Gate Before Every Push

**Applies to:** Every commit destined for `main` or `develop`. Every release candidate.  
**Trigger:** Before `git push`, before creating a PR, before any EAS build submission.

> "The cost of finding a bug in production is 100x the cost of finding it here."

---

## When to Activate

- Before `git push` to any shared branch
- Before creating a pull request
- Before requesting a code review
- Before submitting an EAS build
- Before deploying backend to EC2

---

## Phase 1 — TypeScript Compilation (Must Pass)

```bash
# Backend: zero TypeScript errors required
cd backend && npx tsc --noEmit
echo "Backend TS: $?"

# Mobile: zero TypeScript errors required
cd MobileAppUI && npx tsc --noEmit
echo "Mobile TS: $?"
```

**Threshold:** Zero errors. Any TypeScript error is a hard blocker.

---

## Phase 2 — Linting (Must Pass)

```bash
# Backend lint
cd backend && npm run lint
echo "Backend lint: $?"

# Mobile lint
cd MobileAppUI && npm run lint
echo "Mobile lint: $?"
```

**Acceptable state:** Zero errors. Warnings are acceptable but should be tracked.  
**Red lines:** No `eslint-disable` without an explanatory comment.

---

## Phase 3 — Unit Tests (Must Pass)

```bash
# Backend tests
cd backend && npm test -- --passWithNoTests
echo "Backend tests: $?"

# Mobile tests
cd MobileAppUI && npm test -- --passWithNoTests
echo "Mobile tests: $?"
```

**Threshold:** All existing tests must pass. No new broken tests.

---

## Phase 4 — Build Health Check

```bash
# Backend: verify it compiles to JS without errors
cd backend && npm run build
echo "Backend build: $?"

# Mobile: verify Metro bundler has no errors
# (Run this and look for red errors in output)
cd MobileAppUI && npx expo export --platform android 2>&1 | grep -E "error|Error" | head -20
```

---

## Phase 5 — Security Quick Check

```bash
# Check for high/critical vulnerabilities
cd backend && npm audit --audit-level=high
cd MobileAppUI && npm audit --audit-level=high

# Check for accidentally staged secrets
git diff --cached | grep -iE "(password|secret|api_key|access_token)" | grep -v "example\|test\|TODO\|process\.env"
```

**Threshold:**
- No high or critical npm vulnerabilities
- No secrets in staged changes

---

## Phase 6 — Prisma Schema Validation

```bash
# Run whenever schema.prisma was changed
cd backend && npx prisma validate
echo "Schema valid: $?"

# Check for pending migrations that need to be created
npx prisma migrate status
```

**Threshold:** Schema must be valid. No unapplied changes without a migration file.

---

## Phase 7 — API Contract Check (If API Changed)

If you modified any API endpoint, run these manually:

```
□ New endpoint has authentication middleware (if required)
□ New endpoint has input validation
□ Response shape matches what mobile app expects
□ No breaking changes to existing endpoint paths or response shapes
□ Error responses return { error: string } format consistently
```

---

## Phase 8 — Mobile-Specific Checks (If Mobile Changed)

```
□ No hardcoded IP addresses or localhost URLs in committed code
□ All environment variables used (not hardcoded)
□ New screen added to navigation without breaking existing routes
□ FlatList / SectionList uses keyExtractor
□ TouchableOpacity / Pressable elements have accessible hitSlop
□ Image components have defined width/height (no layout shift)
□ No synchronous operations on the main thread (use async/await)
```

---

## Phase 9 — Git Hygiene Check

```bash
# Verify branch naming is correct
git branch --show-current
# Expected: feature/*, fix/*, hotfix/*, chore/*, docs/*

# Verify no merge conflicts markers
git diff HEAD | grep -E "^[<>]{7}" | head

# Verify commit messages follow Conventional Commits
git log --oneline -5
# Expected: feat:, fix:, chore:, docs:, refactor:, test:
```

---

## Full Gate Run Script

Save this as `scripts/gateguard.sh` and run before every push:

```bash
#!/bin/bash
set -e

echo "=== GateGuard: Starting Quality Gates ==="

PASS=0
FAIL=0

run_check() {
  local name=$1
  local cmd=$2
  echo -n "  [$name] "
  if eval "$cmd" > /dev/null 2>&1; then
    echo "✓ PASS"
    ((PASS++))
  else
    echo "✗ FAIL"
    ((FAIL++))
  fi
}

echo ""
echo "--- TypeScript ---"
run_check "Backend TS" "cd backend && npx tsc --noEmit"
run_check "Mobile TS" "cd MobileAppUI && npx tsc --noEmit"

echo ""
echo "--- Lint ---"
run_check "Backend Lint" "cd backend && npm run lint"
run_check "Mobile Lint" "cd MobileAppUI && npm run lint"

echo ""
echo "--- Build ---"
run_check "Backend Build" "cd backend && npm run build"

echo ""
echo "--- Schema ---"
run_check "Prisma Schema" "cd backend && npx prisma validate"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
if [ $FAIL -gt 0 ]; then
  echo "❌ GateGuard FAILED — fix issues before pushing"
  exit 1
else
  echo "✅ GateGuard PASSED — safe to push"
fi
```

---

## Fast Checklist (Manual Version)

When running scripts is impractical, use this mental checklist:

```
□ 1. TypeScript compiles without errors
□ 2. Lint passes (no errors)
□ 3. All tests pass
□ 4. Backend builds successfully
□ 5. No secrets in staged changes
□ 6. Prisma schema valid (if changed)
□ 7. API contract unchanged (if touched)
□ 8. Mobile-specific rules followed (if mobile changed)
□ 9. Branch name follows convention
□ 10. Commit messages follow Conventional Commits
```

**All 10 boxes must be checked before pushing.**

---

## CI/CD Integration

These same gates should run in GitHub Actions:

```yaml
# .github/workflows/quality-gate.yml
name: Quality Gate
on: [push, pull_request]

jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Backend checks
        run: |
          cd backend && npm ci
          npm run build
          npm run lint
          npx tsc --noEmit
          npx prisma validate
      
      - name: Mobile checks
        run: |
          cd MobileAppUI && npm ci
          npm run lint
          npx tsc --noEmit
```

---

## Verification Checklist

- [ ] TypeScript: zero errors in both backend and mobile
- [ ] Lint: zero lint errors
- [ ] Tests: all passing
- [ ] Build: backend compiles successfully
- [ ] Security: no high/critical npm vulnerabilities
- [ ] Prisma: schema valid, no unapplied migrations
- [ ] API: no breaking changes (if endpoints changed)
- [ ] Mobile: no hardcoded URLs or secrets
- [ ] Git: branch name and commit messages follow conventions
