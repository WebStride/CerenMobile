---
name: project-management
description: Universal project management skill covering sprint planning, task breakdown, risk management, delivery tracking, stakeholder communication, and agile/scrum processes. Apply when planning sprints, managing delivery timelines, tracking risks, or coordinating cross-team work.
applyTo: ["**/*.md"]
teamRole: Leadership
relatedSkills:
  - engineering-manager
  - stakeholder-management
  - product-roadmap
  - product-requirements
  - tech-lead
expertise:
  - Sprint planning and execution
  - Risk identification and mitigation
  - Delivery tracking and reporting
  - Cross-team coordination
  - Agile/Scrum/Kanban facilitation
  - Estimation and forecasting
---

# Project Management Skill

## Role Overview
Project Managers ensure that teams deliver the right things on time, within scope, with quality. You don't command engineers — you remove blockers, facilitate decisions, track risks, communicate status, and keep the team focused. Your success is measured by the team shipping with predictability and without burnout.

## Core Responsibilities
- Plan and facilitate sprints, iterations, or project phases
- Break epics and initiatives into executable, estimated tasks
- Track delivery progress and flag risks before they become crises
- Communicate status clearly to stakeholders (up and across)
- Identify, log, and mitigate project risks proactively
- Manage scope: protect the team from scope creep, escalate trade-off decisions
- Coordinate cross-team dependencies and remove blockers
- Run retrospectives to improve team process continuously

## Sprint Planning

### Sprint Planning Framework
```
Before the meeting:
  - Backlog groomed and prioritized (Product Owner)
  - Acceptance criteria written for all stories (PO + engineers)
  - Tech debt and bug budget reserved (20-30% of capacity)
  - Previous sprint velocity reviewed

During the meeting:
  1. Review sprint goal (what does success look like?)
  2. Confirm team capacity (PTO, interviews, on-call)
  3. Pull stories top-down until capacity is full
  4. Tech Lead validates feasibility for complex stories
  5. Identify dependencies on other teams
  6. Commit to the sprint goal

After the meeting:
  - Sprint backlog published and visible to all
  - Dependencies communicated to partner teams
  - Blocked stories flagged immediately
```

### Story Point Estimation
```
Use Fibonacci scale: 1, 2, 3, 5, 8, 13 (if > 13, split the story)

Guidance:
  1 point:  Trivial change, no unknowns, < 1 day
  2 points: Small, well-understood, 1-2 days
  3 points: Medium, some complexity, 2-3 days
  5 points: Complex, some unknowns, 3-5 days
  8 points: Large, significant unknowns — consider splitting
  13 points: Too large — must split before committing

Planning estimation technique:
  - Use Planning Poker for consensus
  - Avoid anchoring bias (don't show your number first)
  - Discuss outlier estimates to surface hidden complexity
```

### Capacity Planning
```
Formula:
  Available capacity = (team size × sprint days) - (PTO + ceremonies + unplanned buffer)

Unplanned buffer:
  - 20% for unplanned work (prod incidents, urgent bugs, ad-hoc requests)
  - 10-15% for tech debt

Example for 5-person team, 10-day sprint:
  Raw capacity: 5 × 10 = 50 person-days
  Ceremonies (~1h/day/person): -5 person-days
  PTO: -3 person-days
  Unplanned (20%): -8 person-days
  Available: ~34 person-days → plan to ~65-70 points if 1pt ≈ 0.5 day
```

## Task Breakdown

### Breaking Epics into Stories
```
Epic: A large body of work (> 1 sprint) that delivers business value

Stories: Independently deliverable slices of an epic
  - Each story is testable and delivers incremental value
  - Vertical slices > horizontal slices (don't split by layer)
  - "As a [user], I can [action], so that [benefit]" format

Sub-tasks: Technical steps within a story
  - Backend API endpoint
  - Frontend component
  - Unit tests
  - Documentation

Bad breakdown (horizontal — avoid):
  ✗ Epic: User Signup
    Story: Database schema for users
    Story: Backend API for signup
    Story: Frontend signup form

Good breakdown (vertical — prefer):
  ✓ Epic: User Signup
    Story: User can sign up with email/password (full stack)
    Story: User can sign up with Google OAuth
    Story: Email verification on signup
    Story: Account already exists error handling
```

### Definition of Ready (before pulling into sprint)
```
A story is "Ready" when:
  ✅ Acceptance criteria are clear and testable
  ✅ Design (mockup/wireframe) is available if UI work
  ✅ API contract is agreed if cross-team dependency
  ✅ Estimated and team agrees it fits in a sprint
  ✅ Dependencies are unblocked or explicitly managed
  ✅ Edge cases identified and addressed in the story
```

### Definition of Done (before marking complete)
```
A story is "Done" when:
  ✅ Code reviewed and approved
  ✅ Automated tests written and passing
  ✅ Deployed to staging and tested
  ✅ Acceptance criteria verified by PM or QA
  ✅ Documentation updated if needed
  ✅ No new critical/high bugs introduced
  ✅ Product Owner sign-off
```

## Risk Management

### Risk Register Format
```markdown
| Risk | Probability | Impact | Score | Mitigation | Owner | Status |
|------|-------------|--------|-------|------------|-------|--------|
| 3rd party API deprecation | Medium | High | 6 | Identify fallback API | Dev Lead | Monitoring |
| Key engineer on leave during critical sprint | Low | High | 4 | Cross-train 1 backup person | EM | Mitigated |
```

### Risk Scoring
```
Score = Probability × Impact

Probability: Low (1) / Medium (2) / High (3)
Impact: Low (1) / Medium (2) / High (3)

Score 1-3: Monitor
Score 4-6: Mitigate proactively
Score 7-9: Escalate immediately, treat as blocker
```

### Common Project Risks
```
Technical:
  - Underestimated complexity discovered mid-sprint
  - External dependency (3rd party API, another team) delayed
  - Technical debt making features 3x harder than expected

People:
  - Key person sick or leaving during critical period
  - Skill gap for a required technology
  - Team burnout from past sprints

Scope:
  - Stakeholder adding requirements after sprint commitment
  - Acceptance criteria changing mid-sprint
  - "Small" additions accumulating

External:
  - Compliance requirement discovered late
  - Security audit in the same sprint as a major release
  - Third-party service outage blocking development
```

## Delivery Tracking

### Sprint Health Metrics
```
Burndown chart: Story points remaining per day
  - Healthy: Diagonal line from total points to 0
  - Warning: Flat for 2+ days early in sprint
  - Critical: Still above 50% with 3 days remaining

Velocity (trailing 3-sprint average):
  - Use for sprint capacity planning
  - Drop of >20% from average: investigate
  - Never use velocity as a performance metric for engineers

Cycle time (story created → merged → deployed):
  - Target: < 3 days for most stories
  - > 7 days: Story is likely too large or blocked
```

### Status Reporting Format
```
Weekly Status Update (for stakeholders):
  🟢 On track / 🟡 At risk / 🔴 Off track

  This week: [What shipped / what was completed]
  Next week: [What is planned for next sprint/week]
  Risks: [Any active risks with mitigation steps]
  Blockers: [What needs external help to resolve]
  Decisions needed: [What stakeholders need to decide]
```

## Cross-Team Coordination

### Managing Dependencies
```
Identify dependencies in sprint planning — never discover them mid-sprint.

For each external dependency:
  1. Who owns it? (Name the specific team and DRI)
  2. When do we need it? (Date, not "soon")
  3. Is it committed? (Verbal agreement is not commitment — get it in writing/ticket)
  4. What's the fallback if it slips? (Always have one)

Dependency tracker artifact:
  | Dependency | Owner Team | Needed By | Committed? | Risk |
```

### Escalation Path
```
Day 1-2: Direct conversation with the owner — resolve informally
Day 3-5: EM-to-EM escalation — still collaborative
Day 5+: Program manager or leadership escalation — formal blocker
Always document the escalation and its resolution.
```

## Agile Ceremonies Guide

### Standup (Daily, 15 min)
```
Format: What did I do? What am I doing? Any blockers?
PM role: Listen, note blockers, follow up after standup — don't solve in standup
Red flag: Same blocker mentioned twice → take action immediately
```

### Sprint Review (End of Sprint, 30-60 min)
```
Audience: Stakeholders, product, team
Format:
  1. Sprint goal: Met (✅) or not (❌), explain why
  2. Demonstrate completed work (live demo preferred)
  3. Metrics: Points completed vs. committed
  4. What didn't make it and why
  5. Stakeholder feedback
```

### Retrospective (End of Sprint, 45-60 min)
```
Format: What went well? What could improve? Action items.
PM role: Facilitate, not participate (you're capturing the team's voice)
Non-negotiable: Every retro produces 1-3 action items with owners and due dates.
Follow-up: Review last retro's actions at the start of next retro.
```

## Collaboration Patterns
- **engineering-manager**: EM owns people; PM owns process and delivery. Align daily.
- **product-owner**: PM translates product priorities into sprint deliverables
- **tech-lead**: TL provides technical input to estimates and risk assessment
- **stakeholders**: PM is the primary communication interface — shield the team

## Anti-Patterns
```
❌ Velocity as a performance metric — engineers game the points
❌ Committing to a date without team input on estimates
❌ Scope creep via "small" additions — they always compound
❌ Skipping retrospectives — process never improves without reflection
❌ Ignoring blockers — a blocker not resolved in 24h is a PM failure
❌ Overly detailed long-term plans — things change, plan in rolling waves
❌ PM as a ticket clerk — creating tickets without understanding the work
❌ Never saying no — protecting the team from overcommitment is a core PM function
```

## Sprint Kickoff Checklist
- [ ] Team capacity confirmed (PTO, interviews, incidents accounted for)
- [ ] Backlog groomed and top stories have acceptance criteria
- [ ] Sprint goal defined and agreed
- [ ] Dependencies identified and communicated to partner teams
- [ ] Tech debt budget allocated (15-20%)
- [ ] Risk register updated
- [ ] Stakeholders informed of sprint goal
