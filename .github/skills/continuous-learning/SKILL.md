---
name: continuous-learning
description: 'AI learns from the codebase and writes durable instincts to memory files. Use when encountering a new pattern, discovering a bug root cause, completing a feature, or when the AI should remember a project decision for future sessions. Prevents the same mistakes from recurring across sessions.'
argument-hint: 'What pattern, lesson, or decision should be remembered?'
origin: ECC
---

# Continuous Learning — AI Instincts That Persist Across Sessions

**Applies to:** Every session, every feature, every bug fix. Learning happens continuously.  
**Trigger:** After discovering a bug root cause, completing a feature, learning a new pattern, or making an architecture decision.

> "The AI that learns from this project builds trust. The AI that repeats the same mistakes destroys it."

---

## When to Activate

- After fixing a bug (record what caused it and how it was fixed)
- After completing a feature (record the patterns used)
- After a failed approach (record what didn't work and why)
- After reading architecture docs for the first time in a session
- After discovering a project-specific convention not documented elsewhere
- After making an architecture or implementation decision
- When an anti-pattern is discovered in the codebase

---

## Memory File Locations

| Type | Location | Purpose |
|---|---|---|
| Project decisions | `.github/memory/decisions.md` | Architecture and implementation choices |
| Anti-patterns | `.github/memory/anti-patterns.md` | Things that caused bugs or must be avoided |
| Lessons learned | `.github/memory/lessons.md` | What worked and what didn't |
| Repository facts | `/memories/repo/` | Verified project-specific facts |

---

## Steps

### Step 1 — Identify What Was Learned

After any significant event, pause and ask:
- Did I encounter a non-obvious constraint or behavior?
- Did I fix a bug whose root cause is worth remembering?
- Did I discover an established pattern I should follow?
- Was there an approach that failed and shouldn't be tried again?
- Was an architecture decision made that should survive session compaction?

### Step 2 — Read Existing Memory Files

Before writing a new memory note, check what already exists:

```
read_file(".github/memory/decisions.md")
read_file(".github/memory/anti-patterns.md")
read_file(".github/memory/lessons.md")
```

If the learning is already documented: no action needed.  
If it contradicts existing memory: update the existing entry.  
If it's new: add it.

### Step 3 — Write the Learning

**Format for decisions.md:**
```markdown
## [Date] — Decision: [Short Title]
**Context:** What was the situation?
**Decision:** What was decided?
**Rationale:** Why was this the right choice?
**Consequences:** What should be aware of downstream?
```

**Format for anti-patterns.md:**
```markdown
## Anti-Pattern: [Short Title]
**What it is:** Description of the pattern to avoid
**Why it's wrong:** Concrete reason (bug it caused, performance issue, security risk)
**What to do instead:** The correct approach
**File reference (if applicable):** path/to/file.ts
```

**Format for lessons.md:**
```markdown
## Lesson: [Short Title]
**Situation:** When this applies
**What I learned:** The insight
**How to apply it:** Practical guidance
```

### Step 4 — Write Repo-Scoped Facts to /memories/repo/

For verified project facts that are not decisions or anti-patterns, write to `/memories/repo/`:

```
# Example: discovered how env loading works
create memory at /memories/repo/backend-env-loading.md
Content: "Backend env is loaded via dotenv in app.ts. .env must be in backend/ root."
```

### Step 5 — Update copilot-instructions.md for Critical Project Rules

If the learning is important enough to guide ALL future sessions, add it to:
```
.github/copilot-instructions.md
```

in the "Memory" or "Anti-Patterns" section.

---

## What to Record (Examples for This Project)

**Decisions:**
- `USERCUSTOMERMASTER.id` vs `CUSTOMERMASTER.CUSTOMERID` are different IDs — critical distinction
- OTP bypass is gated behind `NODE_ENV === 'development'`
- Cart uses optimistic updates on mobile, confirmed by server on next fetch

**Anti-patterns:**
- Never use `CUSTOMERID` when the API expects `USERCUSTOMERMASTER.id`
- Never commit `.env` or API keys
- Never use `any` type in TypeScript — always type properly
- Never skip `prisma generate` after schema changes

**Lessons:**
- When Prisma returns null for a known record, check that `generate` was run
- MSG91 OTP flow requires the template ID to match the registered template exactly

---

## Verification Checklist

- [ ] Checked existing memory files before writing new entries
- [ ] New learnings written in correct format to correct file
- [ ] Entries are concise and actionable (not verbose prose)
- [ ] Critical project rules added to `.github/copilot-instructions.md` if warranted
- [ ] No duplicate entries created
- [ ] Contradictory old entries updated (not left alongside new ones)
