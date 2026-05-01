---
name: stakeholder-management
description: Communicating product decisions, managing expectations, driving alignment across functions, and handling escalations. Apply when interfacing with leadership, customers, or cross-functional partners.
applyTo: ["**/*.md"]
teamRole: "Product"
relatedSkills:
  - product-roadmap
  - product-requirements
  - engineering-manager
  - tech-lead
  - project-management
expertise:
  - executive-communication
  - alignment-facilitation
  - expectation-management
  - escalation-handling
  - cross-functional-coordination
---

# Stakeholder Management Skill

## Role Overview
The Stakeholder Management role ensures the right people are informed, consulted, and aligned at the right time. Poor stakeholder management creates surprises at launch, scope creep during development, and trust erosion over time.

## Core Responsibilities
- Map and maintain a stakeholder register for each initiative
- Establish communication cadences (weekly sync, monthly review, quarterly roadmap)
- Proactively surface risks and tradeoffs before they become escalations
- Facilitate alignment sessions when stakeholders disagree
- Manage expectations by anchoring on data and constraints, not promises
- Handle escalations calmly and transparently

## Workflows

### Stakeholder Mapping (RACI / Power-Interest Grid)

**RACI Matrix**:
| Role | R = Responsible | A = Accountable | C = Consulted | I = Informed |
|------|-----------------|-----------------|----------------|--------------|
| Product Manager | ✓ | ✓ | | |
| Engineering | ✓ | | ✓ | |
| Design | ✓ | | ✓ | |
| Legal/Compliance | | | ✓ | |
| Sales/CS | | | ✓ | ✓ |
| Leadership/CEO | | ✓ | | ✓ |

**Power-Interest Grid**:
```
HIGH POWER:
  High Interest  → Manage Closely (deeply involved, regular check-ins)
  Low Interest   → Keep Satisfied (update on major milestones only)

LOW POWER:
  High Interest  → Keep Informed (regular updates, get feedback)
  Low Interest   → Monitor (minimal effort, periodic updates)
```

### Communication Templates

**Weekly Status Update**
```markdown
## Week of [Date] — [Initiative Name]

✅ What shipped this week
- [Feature/change deployed]

🔄 In progress
- [Item] — [% done or milestone]

⚠️ Blockers / Risks
- [Issue] → [Mitigation / ask]

📅 Next week
- [Planned items]

📊 Key metrics (if applicable)
- [Metric]: [value] ([trend vs last week])
```

**Executive Briefing (1-pager)**
```markdown
## [Initiative] — [Date]
**Status**: 🟢 On Track / 🟡 At Risk / 🔴 Blocked

**Summary** (2 sentences): What we're building and why it matters.

**Progress**: [X of Y milestones complete]

**Key Risks**:
1. [Risk] — [Likelihood] — [Mitigation]

**Decision Needed** (if any):
[Clear yes/no ask with deadline]

**Next Milestone**: [What] by [When]
```

**Escalation Request**
```markdown
## Escalation: [Issue Title]
**Date**: [today]
**Raised by**: [name]
**Decision needed by**: [date]

**Situation**: [2 sentences — what's happening]
**Impact**: [business/user impact if unresolved]
**Options**:
  A) [Option] — [Trade-off]
  B) [Option] — [Trade-off]
**Recommendation**: Option [X] because [rationale]
**Ask**: [Specific decision or resource needed]
```

### Alignment Facilitation

When stakeholders disagree:
1. **Name the disagreement explicitly**: "We seem to disagree on X — let me frame the decision"
2. **Separate facts from opinions**: Use data to establish common ground
3. **Clarify the trade-off**: "We can have A or B — we can't have both because [constraint]"
4. **Use a decision framework**: DACI keeps ownership clear
5. **Time-box the discussion**: "Let's decide in 15 minutes; we can validate with data after"
6. **Document and send**: Write up the decision + rationale immediately after the meeting

## Best Practices

### Communicating Bad News
- **Never bury the lead**: Start with the problem, not context
- **Come with options**: Don't just surface problems — bring at least 2 options
- **Be specific about impact**: "2 weeks late" not "slightly delayed"
- **Acknowledge failure and own it**: Stakeholders lose trust when PMs deflect
- **Control the narrative**: Share before gossip does — proactive beats reactive

### Managing Up
- Summarize decisions and send written follow-ups after verbal conversations
- Surface risks early — leadership hates surprises more than bad news
- Make asks specific: "I need a decision on X by Friday" not "let me know your thoughts"
- Translate engineering constraints into business language
- Pre-wire key stakeholders before large presentations

### Managing Expectations
- Use ranges, not point estimates: "3-4 weeks" not "3 weeks"
- Make dependencies visible: "This ships if [condition] — here's the risk if it doesn't"
- Never commit on behalf of engineering without their buy-in
- Document verbal commitments immediately in writing

## Collaboration Patterns

### With Engineering Manager / Tech Lead
- Align on capacity and timeline before communicating to stakeholders
- Never commit to dates without EM sign-off
- EM communicates technical constraints; PM translates to business impact

### With Product Roadmap
- Roadmap updates drive stakeholder communication cadence
- Any roadmap change = proactive stakeholder communication before questions come in

### With Leadership
- Monthly product review: progress vs. OKRs
- Quarterly roadmap review: priorities and trade-offs
- Ad hoc escalations: clear ask, clear timeline, recommendation ready

## Anti-Patterns
- **Over-promising**: Commitments made to avoid conflict that can't be kept
- **Silent delivery**: Shipping without communicating progress, then surprising at launch
- **Jargon overload**: Using technical terms with non-technical stakeholders
- **Stakeholder whack-a-mole**: Handling feedback reactively without a communication system
- **No written follow-up**: Verbal agreements that get misremembered or disputed
- **Consensus theater**: Seeking "alignment" on everything — leads to decision paralysis
- **Committing without capacity**: Agreeing to scope without checking with engineering

## Checklist
For each major initiative:
- [ ] Stakeholder register created (RACI + Power-Interest)
- [ ] Communication cadence established and calendared
- [ ] Status update template agreed with stakeholders
- [ ] Escalation path defined (who, how, when)
- [ ] All roadmap commitments have engineering sign-off
- [ ] Written follow-up sent after major verbal discussions
- [ ] Risk register maintained and reviewed weekly

## Related Skills
- `product-roadmap` — roadmap decisions drive stakeholder communication
- `product-requirements` — requirements sign-off requires stakeholder alignment
- `engineering-manager` — joint communication on timeline and risk
- `tech-lead` — technical constraint communication to non-technical stakeholders
- `project-management` — coordinates execution details stakeholders care about
