---
name: verification-loop
description: 'Run a verification loop after every code change to confirm nothing is broken before moving on. Prevents shipping broken code by enforcing: compile → lint → test → type-check after every meaningful change. Works across any stack — React Native, Node.js, TypeScript. Never move to the next task without a green verification loop.'
argument-hint: 'Which file or feature was just changed?'
origin: ECC
---

# Verification Loop — Never Ship Broken Code

**Applies to:** Every code change, before every commit, before every handoff to the next task.  
**Trigger:** Automatically run after completing any implementation step.

> "If it's not verified, it's not done."

---

## When to Activate

- After writing or modifying any source file
- Before committing to git
- Before switching to a new task or feature
- After merging a branch
- After dependency updates
- Before declaring a feature "done"

---

## Core Principles

1. **Verify before you move** — Never leave a change unverified
2. **Fail fast** — Catch errors at the earliest possible stage
3. **Fix the root cause** — Never suppress errors to make verification pass
4. **Full loop minimum** — Run all verification steps, not just the one you think matters
5. **Green loop = trust** — A green loop means the change is safe

---

## Verification Loop Steps

### Step 1 — TypeScript Compile Check

```bash
# Mobile (React Native / Expo)
cd MobileAppUI && npx tsc --noEmit

# Backend
cd backend && npx tsc --noEmit

# If any type errors: fix them before proceeding
```

### Step 2 — Lint Check

```bash
# Mobile
cd MobileAppUI && npx eslint . --ext .ts,.tsx --max-warnings 0

# Backend
cd backend && npx eslint . --ext .ts --max-warnings 0

# Zero warnings policy — fix all lint issues
```

### Step 3 — Test Suite

```bash
# Mobile
cd MobileAppUI && npx jest --passWithNoTests

# Backend
cd backend && npx jest --passWithNoTests

# All tests must pass — no skipped/pending tests in affected areas
```

### Step 4 — Build Check (for critical changes)

```bash
# Backend build
cd backend && npm run build

# Mobile TypeScript check (full)
cd MobileAppUI && npx expo export --platform android --no-publish 2>&1 | head -50

# Confirms no runtime-breaking issues
```

### Step 5 — Prisma Schema Check (for database changes)

```bash
# Only run when Prisma schema was modified
cd backend && npx prisma validate
cd backend && npx prisma generate
```

---

## Minimum Acceptable Loop (Quick Changes)

For small, isolated changes (e.g., fixing a typo, updating a color):

```bash
# Mobile
cd MobileAppUI && npx tsc --noEmit && npx jest --passWithNoTests

# Backend
cd backend && npx tsc --noEmit && npx jest --passWithNoTests
```

---

## Full Loop (Before Every Commit)

```bash
# Run this before every git commit
cd MobileAppUI && npx tsc --noEmit && npx eslint . --ext .ts,.tsx && npx jest
cd backend && npx tsc --noEmit && npx eslint . --ext .ts && npx jest
```

---

## What To Do When Verification Fails

| Failure Type | Action |
|---|---|
| TypeScript error | Fix the type issue — never use `// @ts-ignore` unless legacy code |
| Lint error | Fix the lint issue — never use `// eslint-disable` for new code |
| Test failure | Fix the implementation — never delete or skip tests to make loop pass |
| Build error | Trace the import chain and fix the root cause |
| Prisma error | Fix the schema and re-run `prisma generate` |

---

## Verification Checklist

- [ ] TypeScript compiles with zero errors (`tsc --noEmit`)
- [ ] ESLint passes with zero warnings
- [ ] All tests pass (zero failures, zero unexpected skips)
- [ ] Build succeeds (for critical changes)
- [ ] Prisma schema valid (for schema changes)
- [ ] No `@ts-ignore`, `any`, or `eslint-disable` added to make it pass
- [ ] Verification ran in BOTH `MobileAppUI/` and `backend/` if both were touched
