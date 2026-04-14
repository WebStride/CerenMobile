---
name: product-requirements
description: Writing user stories, acceptance criteria, PRDs, and scope definitions that engineering can build from. Apply before any feature development begins.
applyTo: ["**/*.md", "**/*.yaml", "**/*.json"]
teamRole: "Product"
relatedSkills:
  - product-discovery
  - product-roadmap
  - ux-design
  - frontend-engineer
  - backend-engineer
  - qa-strategy
expertise:
  - user-stories
  - acceptance-criteria
  - prd-writing
  - scope-definition
  - edge-case-mapping
---

# Product Requirements Skill

## Role Overview
The Product Requirements role converts discovery and roadmap decisions into precise, buildable specifications. Clear requirements prevent rework, reduce ambiguity, and give QA a solid testing baseline.

## Core Responsibilities
- Write user stories with clear Persona, Goal, and Rationale (PGR format)
- Define acceptance criteria using Given/When/Then (Gherkin-style)
- Author PRDs (Product Requirements Documents) for medium/large features
- Map edge cases, error states, and empty states before development
- Maintain requirements traceability from business goal → story → test case
- Review and sign off on designs and implementations against requirements

## Workflows

### User Story Template
```markdown
## User Story: [Short title]

**As a** [persona/user type]
**I want to** [goal/action]
**So that** [benefit/rationale]

### Acceptance Criteria
**Given** [initial context/state]
**When** [user action/event]
**Then** [observable outcome]

**Given** [alternative context]
**When** [user action]
**Then** [different outcome]

### Edge Cases
- What happens when [missing data scenario]?
- What happens when [network failure]?
- What happens when [invalid input]?
- What happens when [concurrent access]?

### Out of Scope
- [Explicitly excluded items to prevent scope creep]

### Dependencies
- Blocked by: [Story/ticket ID]
- Blocks: [Story/ticket ID]

### Design
- Link to Figma/design file

### Size
- T-shirt: XS / S / M / L / XL
```

### PRD Template (medium/large features)

```markdown
# PRD: [Feature Name]
**Date**: [date]
**Author**: [PM name]
**Status**: Draft / Review / Approved / Shipped

## Problem Statement
One paragraph: what problem exists, who has it, how we know it's real (data/research reference).

## Goals
- Goal 1 (measurable)
- Goal 2 (measurable)

## Non-Goals
- Explicitly what we are NOT solving in this version

## User Personas
- Primary: [persona] — [key need]
- Secondary: [persona] — [key need]

## Requirements

### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | [Requirement] | Must / Should / Could |

### Non-Functional Requirements
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Performance | p95 < 200ms |
| NFR-2 | Availability | 99.9% uptime |

## User Flows
[Link to Miro / Figma flow]
- If using Miro MCP: ask *"Share your Miro board link so I can extract the flow and identify missing states."*

## Error States & Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| Network timeout | Show retry UI with message |
| Empty state | Show onboarding prompt |
| Rate limit hit | Show 429 friendly error |

## Success Metrics
- Primary: [metric] — target [value] by [date]
- Secondary: [metric] — target [value]

## Open Questions
| Question | Owner | Decision |
|----------|-------|----------|

## Appendix
- Related research: [link]
- Competitive analysis: [link]
```

## Best Practices

### Writing Testable Acceptance Criteria
- Use concrete, observable outcomes: "displays error message" not "handles error"
- Avoid vague words: "fast", "easy", "intuitive", "simple"
- One behavior per criterion — don't combine actions
- Cover happy path, sad path, and empty states

### Scope Management
- Always define explicit **Non-Goals** — this is as important as Goals
- Use **INVEST** criteria for user stories:
  - **I**ndependent (not dependent on other stories)
  - **N**egotiable (not a rigid contract)
  - **V**aluable (delivers value on its own)
  - **E**stimable (can be sized by engineering)
  - **S**mall (completable in one sprint)
  - **T**estable (clear pass/fail criteria)

### Requirements Traceability
```
Business OKR → Feature Theme → Epic → User Story → Acceptance Criteria → Test Case
```
Ensure every story links up to a higher-level goal. Stories without clear business context get de-prioritized in engineering.

## Collaboration Patterns

### With UX Design
- Requirements are inputs to design, not outputs from design
- PM writes "what" and "why" — UX writes "how it looks and flows"
- Review designs against acceptance criteria before handoff to engineering

### With Engineering
- Walk through PRDs in a refinement session before sprint planning
- Allow engineers to raise feasibility concerns early — adjust requirements, not timeline
- Engineers should ask PM clarifying questions before coding, not during

### With QA
- Requirements become the test plan baseline
- QA should review acceptance criteria and flag gaps before development starts
- Edge cases in requirements = test cases in QA plan

### With Product Discovery
- Requirements without discovery evidence are just opinions
- Every requirement should trace back to a user insight, metric, or business constraint

## Anti-Patterns
- **Requirements as implementation specs**: "Add a blue button at position X, Y" — instead specify the goal
- **Ambiguous acceptance criteria**: "The form should work correctly" — untestable
- **Missing empty states**: Requirements that only describe the happy path
- **Scope creep through AC**: Acceptance criteria that grow during sprint without PM sign-off
- **No non-goals**: Without explicit exclusions, engineers assume everything is in scope
- **PRD-by-committee**: Requirements written by committee lose clarity and ownership
- **Stale requirements**: PRDs that aren't updated when scope changes mid-sprint

## Checklist
Before handing off to engineering:
- [ ] User story follows PGR format
- [ ] At least 3 acceptance criteria (happy + sad + edge)
- [ ] Empty state defined
- [ ] Error states defined
- [ ] Non-goals stated explicitly
- [ ] Dependencies mapped (blocked by / blocks)
- [ ] Design link attached
- [ ] Success metrics defined
- [ ] QA has reviewed ACs and agreed they're testable
- [ ] Engineering has estimated / sized the story

## Related Skills
- `product-discovery` — provides the "why" that requirements operationalize
- `product-roadmap` — determines when requirements move to development
- `ux-design` — translates requirements into user flows and wireframes
- `qa-strategy` — converts acceptance criteria into test plans
- `frontend-engineer` — implements UI requirements
- `backend-engineer` — implements API/data requirements
