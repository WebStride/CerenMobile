---
name: product-roadmap
description: Feature prioritization, OKR alignment, quarterly planning, stakeholder roadmap communication, and roadmap tooling. Apply when planning product direction, sequencing features, or communicating strategy.
applyTo: ["**/*.md", "**/*.json", "**/*.yaml"]
teamRole: "Product"
relatedSkills:
  - product-discovery
  - product-requirements
  - product-metrics
  - stakeholder-management
  - architect
expertise:
  - feature-prioritization
  - okr-planning
  - capacity-planning
  - roadmap-communication
---

# Product Roadmap Skill

## Role Overview
The Product Roadmap role owns the strategic sequencing and communication of what gets built and when. This role bridges business goals and engineering capacity, maintaining a living document that stakeholders can trust.

## Core Responsibilities
- Translate company OKRs and business goals into a prioritized feature backlog
- Maintain a time-horizoned roadmap (Now / Next / Later) visible to all stakeholders
- Facilitate prioritization sessions balancing user value, technical feasibility, and business impact
- Communicate roadmap changes proactively and explain the rationale
- Track delivery confidence and adjust plan when scope or capacity changes

## Workflows

### Quarterly Planning Cycle
1. **Gather inputs** — review OKRs, review discovery learnings, collect stakeholder requests
2. **Score and rank** — use prioritization framework (RICE, MoSCoW, or Kano) to rank items
3. **Capacity map** — align items to engineering team capacity (story points or T-shirt sizes)
4. **Draft roadmap** — build Now/Next/Later view; assign themes, not just features
5. **Review with stakeholders** — async share + sync walkthrough; capture objections
6. **Publish and lock** — version the roadmap; share link; set review cadence

### Prioritization Frameworks

**RICE Scoring**
```
Score = (Reach × Impact × Confidence) / Effort
```

| Factor | Definition |
|--------|-----------|
| Reach | Users impacted per period |
| Impact | 0.25 (minimal) → 3 (massive) |
| Confidence | % confidence in estimates |
| Effort | Person-months |

**MoSCoW**
- **Must**: Non-negotiable for launch
- **Should**: High value, not blocking launch
- **Could**: Nice to have, cut if needed
- **Won't**: Explicitly out of scope this cycle

**Kano Model**
- Basic (expected): Users won't notice if present; they'll complain if absent
- Performance (linear): More = better
- Delighters: Unexpected features that create love

### Roadmap Horizons
```
NOW (0-3 months):
  - Committed items backed by signed-off resources
  - Near-complete user stories
  - No new scope additions without explicit trade-off

NEXT (3-6 months):
  - High-confidence items pending capacity unlock
  - Discovery in progress
  - Subject to re-ordering

LATER (6+ months):
  - Strategic bets and themes
  - Low fidelity - describe outcomes not features
  - Intentionally vague
```

## Best Practices

### Writing Good Roadmap Items
- **Outcome-first**: "Reduce churn for SMB customers" not "Add export feature"
- **Metric-anchored**: Every roadmap item should map to a measurable outcome
- **Size-balanced**: Mix large (theme) and small (quick win) items each quarter
- **Dependency-aware**: Surface cross-team dependencies early; escalate blockers

### Roadmap Documentation
```markdown
## Feature: [Name]
**Outcome**: What business/user problem this solves
**Metric**: How success is measured
**Horizon**: Now / Next / Later
**Size**: S / M / L / XL
**Dependencies**: [Team A], [System B]
**Status**: Discovery / Scoping / In-dev / Shipped
**Owner**: PM + EM
```

### Avoiding Roadmap Anti-Patterns
- Never treat roadmap as a commitment to exact dates (unless contractual)
- Never list tasks — list outcomes and features
- Never skip dependency mapping in cross-team items
- Never update roadmap without stakeholder notification

## Collaboration Patterns

### With Product Discovery
- Discovery validates **whether** something should be on the roadmap
- Roadmap determines **when** it gets built
- Always require a discovery artifact (research, user interview, data) before adding to NOW horizon

### With Engineering (Tech Lead / Architect)
- Run weekly backlog refinement to size and de-risk upcoming items
- Share roadmap at sprint planning level — team needs context, not just tickets
- Allow engineers to flag "technical debt tax" — budget 20% capacity for non-feature work

### With Stakeholders
- Share roadmap monthly; review changes quarterly
- Use a DACI for each major roadmap decision (Driver, Approver, Consulted, Informed)
- Present roadmap as themes + outcomes, not feature lists — reduces scope creep negotiation

### With Product Metrics
- Each roadmap item needs a success metric defined before development starts
- After launch, close the loop: did the metric move? Update roadmap confidence scores

## Tools & Practices
- **Linear / Jira** — Issue tracking with roadmap views
- **Notion / Confluence** — Living roadmap document
- **Productboard / Aha!** — Dedicated roadmap tools with scoring
- **Miro** — Visual roadmap planning and stakeholder alignment sessions
  - **Miro MCP**: If planning session uses Miro, ask: *"Please share your Miro board link so I can extract current roadmap state and help reorganize priorities."*
- **GitHub Projects** — Engineering-native roadmap for technical teams

## Anti-Patterns
- **Feature factory**: Shipping features without measuring outcomes
- **HiPPO-driven**: Highest-Paid Person's Opinion overrides data
- **Date commitment theater**: Promising exact dates to stakeholders without engineering buy-in
- **Roadmap rot**: Roadmap not updated as reality changes, becomes untrustworthy
- **Too granular**: Roadmap full of tasks instead of outcomes — becomes a detailed Gantt chart
- **No trade-offs**: Adding items without removing others — infinite roadmap = no roadmap
- **Waterfall disguise**: Fixed scope + fixed timeline with no flexibility = roadmap lying about agility

## Checklist
Before publishing/updating a roadmap:
- [ ] Every NOW item has an owner (PM + EM) and a success metric
- [ ] RICE or MoSCoW scores assigned to all items
- [ ] Engineering has sized all NOW items (at minimum T-shirt size)
- [ ] Dependencies identified and owners notified
- [ ] Stakeholders reviewed and signed off
- [ ] Roadmap version/date updated
- [ ] Link shared in team Slack/channel

## Related Skills
- `product-discovery` — validates roadmap items before they move to NOW
- `product-requirements` — converts roadmap items into detailed user stories
- `product-metrics` — defines success metrics for each roadmap item
- `stakeholder-management` — communication cadence for roadmap updates
- `architect` — technical feasibility review of roadmap items
- `engineering-manager` — capacity planning alignment
