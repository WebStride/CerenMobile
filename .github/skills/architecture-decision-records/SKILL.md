---
name: architecture-decision-records
description: 'ADR (Architecture Decision Record) creation and management workflow. Captures why major technical decisions were made, what alternatives were considered, and the consequences. Use when making any significant architecture, technology, or design choice that future developers need to understand.'
argument-hint: 'What decision are you recording? (technology choice, architecture pattern, API design, database schema)'
origin: ECC
---

# Architecture Decision Records (ADR)

**Applies to:** Any significant technical decision with lasting consequences.  
**Trigger:** Before finalizing any major technical choice. After discovering why an existing pattern exists.

> "Code tells you how. ADRs tell you why."

---

## When to Write an ADR

Write an ADR when:
- Choosing between two or more viable technologies (e.g., JWT vs session cookies)
- Deciding on a major architecture pattern (e.g., monolith vs microservices)
- Making a decision that will be hard or costly to reverse
- Choosing a pattern that will be applied consistently across the codebase
- Overriding a previously established pattern (must justify it)
- When future-you or a new team member will ask "why did we do it this way?"

Do NOT write an ADR for:
- Naming a variable
- Choosing between two equivalent approaches with no meaningful tradeoff
- Bug fixes
- Small refactors

---

## ADR Storage Location

```
.github/
└── decisions/
    ├── ADR-001-auth-token-storage.md
    ├── ADR-002-prisma-over-raw-sql.md
    ├── ADR-003-expo-managed-workflow.md
    └── ADR-004-msg91-for-otp.md
```

Also update `.github/memory/decisions.md` with a one-line summary for quick reference.

---

## ADR File Format

Use this template for every ADR:

```markdown
# ADR-[NNN]: [Title — short description of the decision]

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-NNN  
**Deciders:** [Names or roles of decision makers]

---

## Context

[1-3 paragraphs explaining the problem or situation that required a decision.
What constraints exist? What forces are at play? What was the trigger?]

## Decision

[1-2 sentences: exactly what was decided.]

**We will [chosen approach].**

## Alternatives Considered

| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| [Option A] | ... | ... | [Reason] |
| [Option B] | ... | ... | [Reason] |
| [Chosen option] | ... | ... | Chosen ✓ |

## Consequences

**Positive:**
- [Expected benefit 1]
- [Expected benefit 2]

**Negative / Trade-offs:**
- [Known limitation or cost]
- [What this decision forecloses]

**Risks:**
- [Risk 1 and mitigation]

## Implementation Notes

[Optional: key implementation details, links to code, migration steps]

---

*Superseded by: [ADR-NNN] (if applicable)*
```

---

## Example ADR — Token Storage

```markdown
# ADR-001: Use expo-secure-store for Auth Token Storage

**Date:** 2024-01-15  
**Status:** Accepted  
**Deciders:** Backend Lead, Mobile Lead

---

## Context

The mobile app requires storing JWT access tokens and refresh tokens on-device
after authentication. Tokens need to persist across app restarts. Multiple
storage options exist in React Native/Expo.

## Decision

**We will use expo-secure-store for all auth token storage.**

## Alternatives Considered

| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| AsyncStorage | Simple API, widely used | Stores in plain text, accessible to other apps | Security risk |
| MMKV | Very fast reads | Not encrypted by default | Security risk |
| expo-secure-store | Encrypted on device (Keychain/Keystore) | Slightly more verbose API | Chosen ✓ |

## Consequences

**Positive:**
- Tokens are encrypted at rest using OS-level keychain/keystore
- Meets OWASP mobile security standards
- Expo manages encryption keys via secure hardware

**Negative / Trade-offs:**
- expo-secure-store has a size limit (~2KB per entry)
- Cannot store very large tokens

**Risks:**
- Device backup may not include secure store items (acceptable — user re-logs in)

## Implementation Notes

```typescript
import * as SecureStore from 'expo-secure-store';

// Store token
await SecureStore.setItemAsync('accessToken', token);

// Retrieve token
const token = await SecureStore.getItemAsync('accessToken');
```
```

---

## ADR Numbering Convention

```
ADR-001 through ADR-009: Core architecture (auth, database, framework choices)
ADR-010 through ADR-019: API design decisions
ADR-020 through ADR-029: Mobile-specific decisions
ADR-030 through ADR-039: Infrastructure and deployment
ADR-040+: Feature-specific decisions
```

---

## Updating Existing ADRs

**Never delete or edit an ADR's history.**

- If a decision is reversed, mark status as `Deprecated` or `Superseded by ADR-NNN`
- Write a new ADR for the new decision and reference the old one
- Keep the full history for future context

```markdown
**Status:** Superseded by ADR-012

*Note: As of 2024-06-01, this decision was reversed due to [reason].
See ADR-012 for the replacement approach.*
```

---

## Updating memory/decisions.md

After writing each ADR, add a one-liner to `.github/memory/decisions.md`:

```markdown
## ADR Index

- **ADR-001**: Auth tokens stored in expo-secure-store (NOT AsyncStorage) — encrypted on device
- **ADR-002**: Prisma ORM for all DB access — type-safe, migration history, no raw SQL in app code
- **ADR-003**: Expo managed workflow — simpler build/update, no bare native code unless required
- **ADR-004**: MSG91 for OTP — supports Indian mobile numbers, cost-effective, proven reliability
```

---

## Lightweight ADR for Speed

When a decision is clear and fast, use this minimal format and expand later:

```markdown
# ADR-NNN: [Title]

**Date:** YYYY-MM-DD  
**Status:** Accepted

**Decision:** [One sentence]

**Why:** [Two to three sentences explaining context and reason]

**Trade-offs:** [What this costs or forecloses]
```

---

## Verification Checklist

- [ ] ADR file created in `.github/decisions/ADR-NNN-[slug].md`
- [ ] All three required sections present: Context, Decision, Consequences
- [ ] Alternatives table populated (even if only 1 alternative)
- [ ] `.github/memory/decisions.md` updated with one-line summary
- [ ] Status set to `Accepted`
- [ ] Date and deciders recorded
- [ ] If superseding an old ADR: old ADR updated with `Superseded by` note
