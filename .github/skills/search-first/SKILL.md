---
name: search-first
description: 'Research-first guardrail: always search and read before writing any code. Prevents hallucinating APIs, duplicating existing utilities, or violating project architecture. Use before implementing any new feature, utility, component, or API endpoint. Search the codebase → read relevant files → check docs → then code.'
argument-hint: 'What are you about to implement or change?'
origin: ECC
---

# Search First — Research Before You Code

**Applies to:** Every implementation task — features, components, API endpoints, utilities, database queries.  
**Trigger:** BEFORE writing any code, always run this workflow first.

> "The best code is code you don't have to write because it already exists."

---

## When to Activate

- Before creating any new file or component
- Before implementing any utility function
- Before adding a new API endpoint
- Before writing a database query
- Before using any library API or method
- Before modifying any shared code

---

## Core Principles

1. **Assume it exists** — Search before assuming you need to create something new
2. **Read the actual code** — Don't guess how existing utilities work; read them
3. **Check the docs** — Library APIs change; verify against current documentation
4. **Understand the context** — Know where your change fits in the architecture
5. **Discover conventions** — Learn the project's patterns before inventing your own

---

## Steps

### Step 1 — Search for Existing Implementations

Before writing anything, search the codebase for what you need:

```
# Search for existing utility or component
search_codebase("cart", "MobileAppUI/")
search_codebase("formatPrice", "MobileAppUI/utils/")
search_codebase("useAuth", "MobileAppUI/services/")

# Search for API endpoint pattern
search_codebase("router.post", "backend/src/routes/")
search_codebase("cartController", "backend/src/")

# Search for Prisma query patterns
search_codebase("prisma.order", "backend/src/")
```

**If it exists:** Read it, understand it, reuse or extend it.  
**If it doesn't exist:** Proceed to Step 2.

### Step 2 — Read Architecture Documentation

Before building something new, read the relevant architecture docs:

```
read_file("docs/architecture.md")
read_file(".github/copilot-instructions.md")
read_file(".github/design.md")
```

Understand:
- Where does this piece of code belong?
- What patterns are already established?
- What are the data model boundaries?
- What authentication/authorization rules apply?

### Step 3 — Check Context7 Documentation for Library APIs

Before using any library function, look up current docs:

```
# Always verify library APIs before using them
context7.resolve-library-id("react-native")
context7.get-library-docs("react-native", "FlatList")

context7.resolve-library-id("prisma")
context7.get-library-docs("prisma", "findMany")

context7.resolve-library-id("expo")
context7.get-library-docs("expo", "SecureStore")
```

**Why:** Library APIs change across versions. Your training data may be outdated.

### Step 4 — Read Related Files

Read the files most closely related to what you're building:

```
# If building a cart feature, read:
read_file("MobileAppUI/app/(tabs)/CartScreen.tsx")
read_file("backend/src/controllers/cart/cartController.ts")
read_file("backend/src/routes/cart.ts")
read_file("backend/prisma/schema.prisma")  # for data model
```

### Step 5 — Identify Patterns to Follow

Look for the established pattern in similar, already-working code:

```
# Find a similar feature that already works correctly
search_codebase("useQuery", "MobileAppUI/services/")
# Read it to understand the established pattern
read_file("MobileAppUI/services/useFetch.ts")
```

Now build your implementation following the same pattern.

### Step 6 — Plan Before Coding

Write a brief plan (in comments or mental model) before touching any file:
- What files will be created?
- What files will be modified?
- What interfaces/types are needed?
- What tests will be written?

---

## Common Search Patterns for This Project

```bash
# Find all API service calls
grep -r "api\." MobileAppUI/services/

# Find all Prisma models
grep -r "prisma\." backend/src/

# Find all route definitions
grep -r "router\." backend/src/routes/

# Find all screen components
find MobileAppUI/app -name "*.tsx" -type f

# Find all shared components
find MobileAppUI/components -name "*.tsx" -type f

# Find environment variable usage
grep -r "process.env\|EXPO_PUBLIC_" backend/src/ MobileAppUI/
```

---

## Verification Checklist

- [ ] Searched codebase for existing implementations before writing new code
- [ ] Read architecture docs (`docs/architecture.md`) before major changes
- [ ] Verified library APIs against current documentation (Context7)
- [ ] Read at least 3 related files to understand established patterns
- [ ] Identified the correct location for new code in the project structure
- [ ] No duplicate utilities or components created
- [ ] New code follows the same patterns as existing, working code
