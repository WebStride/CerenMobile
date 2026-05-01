---
name: git-workflow
description: 'Git branching, commit message standards, PR workflow, and merge discipline for the CerenMobile project. Enforces conventional commits, branch naming conventions, pull request checklists, and safe merge practices. Use when creating branches, writing commits, preparing PRs, or reviewing git history.'
argument-hint: 'What git operation are you performing? (branch, commit, PR, merge)'
origin: ECC
---

# Git Workflow — Branching, Commits, and PRs

**Applies to:** All code changes — features, bug fixes, hotfixes, refactors.  
**Trigger:** Whenever starting new work, committing code, or preparing a PR.

> "A clean git history is documentation. Treat commits as permanent records."

---

## When to Activate

- Starting work on a new feature or bug fix
- Ready to commit code changes
- Preparing a pull request for review
- Reviewing and merging a PR
- Creating a hotfix for production

---

## Branch Naming Convention

```
# Format
<type>/<ticket-or-short-description>

# Examples
feature/add-cart-wishlist-sync
fix/otp-resend-not-working
hotfix/prod-order-total-calculation
refactor/clean-up-api-service-layer
chore/update-prisma-to-v6
docs/add-deployment-guide
test/add-cart-unit-tests
```

### Branch Types
| Type | When to use |
|---|---|
| `feature/` | New functionality |
| `fix/` | Bug fixes (non-production) |
| `hotfix/` | Urgent production bug fixes |
| `refactor/` | Code restructuring without behavior change |
| `chore/` | Dependencies, tooling, config |
| `docs/` | Documentation only |
| `test/` | Adding or fixing tests |

---

## Commit Message Convention (Conventional Commits)

```
# Format
<type>(<scope>): <short description>

# Optional body
<blank line>
<longer explanation if needed>

# Optional footer
<blank line>
Closes #<issue-number>
```

### Commit Types
| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither adds feature nor fixes bug |
| `test` | Adding or updating tests |
| `chore` | Tooling, dependency updates |
| `docs` | Documentation changes |
| `style` | Formatting only (no logic change) |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |

### Good Commit Examples
```bash
git commit -m "feat(cart): add product quantity selector with long-press increment"
git commit -m "fix(otp): handle MSG91 timeout with retry after 3 seconds"
git commit -m "refactor(auth): extract token refresh logic into dedicated service"
git commit -m "test(orders): add integration tests for order creation flow"
git commit -m "chore(deps): update prisma client to 5.22.0"
```

### Bad Commit Examples (Never Do These)
```bash
# Too vague
git commit -m "fix bug"
git commit -m "update"
git commit -m "changes"
git commit -m "WIP"

# No type
git commit -m "added cart feature"
```

---

## Workflow Steps

### Step 1 — Create Feature Branch

```bash
# Always branch off from main (or develop if it exists)
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Step 2 — Develop with Small, Atomic Commits

Commit often. Each commit should:
- Do exactly one thing
- Leave the codebase in a working state
- Be understandable without reading the diff

```bash
# Stage related changes together
git add MobileAppUI/app/(tabs)/CartScreen.tsx
git add MobileAppUI/services/api.ts
git commit -m "feat(cart): add remove item button with swipe gesture"

# Then commit tests separately
git add MobileAppUI/app/(tabs)/__tests__/CartScreen.test.tsx
git commit -m "test(cart): add tests for remove item from cart"
```

### Step 3 — Keep Branch Up to Date

```bash
# Regularly rebase on main to avoid large merge conflicts
git fetch origin
git rebase origin/main

# If conflicts arise, resolve them carefully
# Never use --force-push on shared branches
```

### Step 4 — Pre-PR Verification Loop

Before opening a PR, run the full verification loop:
```bash
cd MobileAppUI && npx tsc --noEmit && npx jest
cd backend && npx tsc --noEmit && npx jest
```

### Step 5 — Create Pull Request

PR title must follow the same format as commit messages:
```
feat(cart): add product quantity selector with long-press increment
```

PR description template:
```markdown
## What Changed
Brief description of what this PR does.

## Why
The business reason or user story this addresses.

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual test on Android device

## Screenshots (for UI changes)
Attach before/after screenshots for any visual changes.

## Checklist
- [ ] No `console.log` statements left in code
- [ ] No hardcoded credentials or API keys
- [ ] TypeScript compiles cleanly (`tsc --noEmit`)
- [ ] All tests pass
- [ ] Self-reviewed this PR before requesting review
```

### Step 6 — Review and Merge

```bash
# Merge strategy: squash for feature branches, merge commit for releases
# On GitHub: use "Squash and merge" for feature branches

# After merge: delete the branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

---

## Hotfix Workflow (Production Bugs)

```bash
# Branch off from main directly
git checkout main
git pull origin main
git checkout -b hotfix/fix-order-total-calculation

# Fix the bug, run verification loop
# Commit with hotfix type
git commit -m "fix(orders): correct total calculation for multi-item orders"

# Open PR with [HOTFIX] prefix in title for visibility
# Merge immediately after review
```

---

## Git Hygiene Rules

1. **Never force-push to main** — `git push --force origin main` is forbidden
2. **Never commit secrets** — Check with `git diff --cached` before committing
3. **Never commit build artifacts** — `/build`, `node_modules`, `.expo` in `.gitignore`
4. **Never commit environment files** — `.env`, `.env.local`, `.env.production`
5. **Review your own diff first** — Run `git diff --cached` before every commit

---

## Verification Checklist

- [ ] Branch name follows `<type>/<description>` convention
- [ ] All commits follow Conventional Commits format
- [ ] No vague commit messages (`fix`, `update`, `changes`)
- [ ] Verification loop ran green before PR
- [ ] PR description filled out with what, why, and testing evidence
- [ ] No secrets or API keys in the diff
- [ ] Branch deleted after merge
