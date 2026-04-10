---
name: ux-research
description: Universal UX research skill covering user interviews, surveys, usability testing, synthesis, and insight communication. Apply when validating product decisions, understanding user behavior, or prioritizing features based on evidence. Integrates with Miro MCP for affinity mapping and insight boards.
applyTo: ["**/*.md"]
teamRole: Design
relatedSkills:
  - ux-design
  - product-discovery
  - product-metrics
  - stakeholder-management
expertise:
  - user-interviews
  - usability-testing
  - survey-design
  - synthesis
  - insight-communication
---

# UX Research Skill

## Activation

Before conducting research, check `.github/design.md` for existing user personas or research notes. If a Miro board exists, ask:
> "Do you have a Miro board for research synthesis? Share the link and I'll help structure the affinity map using Miro MCP."

---

## Role Overview

UX Researchers generate evidence-based understanding of user behavior, needs, and motivations. They turn ambiguous product questions into clear, actionable insights that reduce risk, validate assumptions, and inform design and product decisions.

---

## Core Responsibilities

- Plan and execute research studies
- Conduct user interviews, usability tests, and surveys
- Synthesize findings into actionable insights
- Communicate insights to product and design stakeholders
- Maintain a research repository for institutional memory
- Quantify usability issues with severity ratings

---

## Research Methods by Question Type

| Research Question | Method | Timeline |
|------------------|--------|---------|
| What do users need? | Contextual interviews | 2–3 weeks |
| Can users complete tasks? | Moderated usability test | 1–2 weeks |
| Why are users dropping off? | Session recording analysis + follow-up interviews | 1 week |
| How do users feel? | Survey + NPS | 3–5 days |
| What do users prefer? | A/B test or preference test | Ongoing |
| What patterns emerge? | Diary study | 2–4 weeks |
| How many users have this issue? | Analytics + survey | 1 week |

---

## Research Planning

### Research Brief Template
```markdown
## Research Study: [Feature/Problem Name]

**Research Question:** What is the single most important thing we need to learn?

**Hypothesis:** We believe [user segment] needs [outcome] because [evidence/assumption].

**Method:** [Interview / Usability Test / Survey / Analytics]

**Participants:** [n=X], criteria: [age, role, experience level, behavior]

**Timeline:** [Start] → [End]

**Deliverable:** [Insights doc / Affinity map / Usability report]

**Decision it informs:** [What product decision will this answer?]
```

---

## User Interviews

### Screener Criteria
- Define 3–5 qualifying criteria matching the target user segment
- Avoid "professional survey-takers" — use recruitment platforms (UserTesting, Respondent, Maze)
- Aim for n=5 for qualitative interviews (diminishing returns after 5 per segment — Nielsen Norman finding)

### Interview Structure (60 min)
1. **Intro** (5 min) — purpose, consent, recording permission
2. **Warm-up** (10 min) — background, role, typical day, tools they use
3. **Core questions** (35 min) — behavior-based questions only (see below)
4. **Task walkthrough** (5 min) — show me how you currently do [task]
5. **Wrap-up** (5 min) — anything else? any questions?

### Behavior-Based Questions (not opinions)
✅ "Walk me through the last time you [did X]."
✅ "What did you do when [situation]?"
✅ "Show me how you currently handle [task]."
❌ "Would you use this feature?" (hypothetical — meaningless)
❌ "What do you think of this design?" (opinion, not behavior)
❌ "Do you like X or Y better?" (preference, not insight)

---

## Usability Testing

### Test Script Structure
1. **Task intro** — describe the scenario without leading the user
2. **Think-aloud prompt** — "Please talk through what you're thinking as you work"
3. **Task statement** — realistic scenario ("You've just received an invoice...")
4. **Observation notes** — hesitations, errors, backtracking, verbal frustration
5. **Post-task questions** — Single Ease Question (SEQ): "On a scale of 1–7, how difficult was that?"

### Metrics to Capture
- **Task completion rate** — % who complete without assistance
- **Time on task** — seconds to complete
- **Error rate** — number of errors per task
- **SEQ score** — subjective ease rating (1–7 scale)
- **SUS score** — System Usability Scale (post-session, 10 questions)

### Severity Rating (Nielsen)
| Rating | Description |
|--------|-------------|
| 0 | Not a usability problem |
| 1 | Cosmetic — fix if time permits |
| 2 | Minor — low priority |
| 3 | Major — important to fix |
| 4 | Catastrophic — must fix before launch |

---

## Synthesis

### Affinity Mapping (use Miro MCP if available)
1. Write one observation per sticky note ("User said...", "User did...")
2. Group stickies into themes by similarity
3. Name each cluster with an insight statement (not a description)
4. Vote on clusters by frequency and severity
5. Extract top 3–5 insights as action items

### Insight Statement Formula
> "[User type] struggles with [behavior] because [root cause], which leads to [consequence]."

Example: "Finance managers struggle with expense reconciliation because the system doesn't show real-time sync status, which leads to duplicate manual entries and lost time."

---

## Communicating Findings

### Research Report Structure
1. **TL;DR** — 3 key findings in 3 bullets
2. **Background** — what was studied and why
3. **Methodology** — method, n, participant profile
4. **Key Findings** — 3–5 findings with supporting evidence (quotes, video clips, metrics)
5. **Severity Assessment** — impact × frequency matrix
6. **Recommendations** — design/product recommendations per finding
7. **Appendix** — raw interview notes, survey data, session recordings

### Insight → Recommendation Format
```
Finding: [observation + evidence]
Impact: [business/user impact]
Recommendation: [specific design/product action]
Priority: Critical / High / Medium / Low
```

---

## Collaboration Patterns

- **with product-discovery**: Share research artifacts — personas, Jobs-to-be-Done maps, opportunity areas
- **with ux-design**: Research validates/invalidates UX assumptions before wireframing
- **with product-requirements**: Findings translate into acceptance criteria and user story context
- **with product-metrics**: Pair qualitative insights with quantitative data for full picture
- **with stakeholder-management**: Communicate findings as business risk/opportunity, not just user pain

---

## Anti-Patterns

- Asking leading questions ("Don't you think this button is confusing?")
- Recruiting from internal teams or friends — they're not representative users
- Presenting opinions as findings without supporting evidence
- Over-recruiting (n=20 for qual interviews wastes time; insights plateau at n=5)
- Not recording sessions — you miss non-verbal cues
- Research conducted after design is "done" — too late to act on findings
- Prioritizing features users SAY they want over what they actually DO (Kano model)

---

## Checklist

- [ ] Research question is specific and decision-oriented
- [ ] Participants match target user segment (not internal team)
- [ ] Interview questions are behavior-based (not opinion/hypothetical)
- [ ] Sessions recorded with consent
- [ ] Synthesis completed (affinity map or thematic analysis)
- [ ] Insights follow "[user] [behavior] because [cause] leads to [consequence]" format
- [ ] Severity ratings assigned to all issues
- [ ] Recommendations are specific and actionable
- [ ] Findings shared with product + design + engineering
- [ ] Research added to team research repository
