---
name: product-discovery
description: Universal product discovery skill covering user research, problem validation, opportunity sizing, Jobs-to-be-Done framework, and stakeholder interviews. Integrates with Miro MCP for flow visualization.
applyTo: ["**/*.md", "**/*.mdx"]
teamRole: Product
relatedSkills:
  - product-requirements
  - ux-research
  - product-metrics
  - stakeholder-management
expertise:
  - user-research
  - problem-validation
  - opportunity-sizing
  - jobs-to-be-done
  - competitive-analysis
  - discovery-interviews
---

# Product Discovery Skill

## Role Overview
The product discovery practitioner investigates whether a problem is worth solving before a solution is built. Responsible for understanding user needs, validating assumptions, sizing opportunities, and ensuring the team builds the right things — not just things right.

> **Miro MCP**: When mapping user flows, journey maps, or opportunity spaces — ask for the Miro dashboard link and use Miro MCP to read/create diagrams directly: "Please share your Miro board link so I can extract the current flow and help structure findings."

---

## Core Responsibilities
- Conduct user interviews to understand unmet needs
- Identify and validate problem hypotheses before building
- Define the opportunity space and size it (TAM/SAM/SOM or job frequency × severity)
- Map customer journeys and pain points
- Facilitate discovery workshops with cross-functional teams
- Synthesize qualitative and quantitative signals into clear problem statements
- De-risk ideas early through rapid experiments
- Hand off validated problem statements to product-requirements

---

## Workflows

### Discovery Sprint Workflow
1. **Frame the problem space** — What domain are we exploring? What assumptions are we making?
2. **Research plan** — Define research goals, participant criteria, methods (interviews, surveys, analytics review)
3. **User interviews** — 5–8 interviews typically sufficient for saturation
4. **Synthesis** — Affinity mapping, theme clustering, JTBD extraction
5. **Opportunity sizing** — Frequency × severity matrix; estimate impact if solved
6. **Assumption mapping** — List all assumptions; rank by risk (impact × uncertainty)
7. **Experiment design** — Design the smallest test to invalidate riskiest assumption
8. **Decision** — Pursue / pivot / park based on evidence

### User Interview Workflow
1. Prepare open-ended questions (no leading questions)
2. Focus on past behavior, not hypothetical futures ("Tell me about the last time you...")
3. Listen for workarounds — these reveal unmet needs
4. Record (with consent) and take timestamped notes
5. Debrief immediately after — capture key quotes and observations
6. Use Miro for affinity mapping across interview notes

### Opportunity Sizing Workflow
1. Estimate the # of users who experience the problem
2. Rate frequency (daily/weekly/monthly/rare)
3. Rate severity (blocker / major friction / minor annoyance)
4. Calculate: Impact Score = (# users) × (frequency weight) × (severity weight)
5. Compare against engineering investment estimate
6. Document in opportunity canvas

---

## Best Practices

### Research
- Always separate problem discovery from solution validation
- Never show mockups during problem discovery interviews — it anchors thinking
- Recruit participants who match the actual user segment, not convenience samples
- 5 interviews reveal ~85% of usability/need patterns — don't over-research
- Validate with data: triangulate qualitative findings with analytics

### Problem Framing
- Use Jobs-to-be-Done: "When [situation], I want to [motivation], so I can [outcome]"
- Write problem statements without implying a solution
- Bad: "Users need a better dashboard" → Good: "Users can't quickly identify which clients need follow-up"
- Always include who has the problem, context, and impact

### Assumption Management
- Explicitly list all assumptions for every opportunity
- Rank by: high impact + high uncertainty = most dangerous
- Design experiments to invalidate (not confirm) assumptions
- Track assumption status over time

---

## Collaboration Patterns

### With ux-research
- Share research plans early — align on methodology and participant pool
- Co-synthesize findings — different perspectives catch different patterns

### With product-requirements
- Discovery outputs feed directly into requirements — no handoff gap
- Problem statement + validated assumptions → acceptance criteria

### With product-metrics
- Define what "success" looks like before building
- Agree on North Star metric for the opportunity

### With ux-design
- Share raw interview notes — designers often spot design implications product misses
- Involve designers in discovery sprints, not just delivery

---

## Tools & Technologies
| Tool | Purpose |
|------|---------|
| Miro | Journey mapping, affinity clustering, opportunity trees |
| Dovetail / Notion | Interview notes, synthesis, tagging |
| Hotjar / FullStory | Behavioral analytics, heatmaps |
| Typeform / SurveyMonkey | Quantitative surveys |
| Loom | Async user interview sharing |
| Mixpanel / Amplitude | Product analytics for quantitative signals |

---

## Anti-Patterns
- Building first and discovering later ("build it and they will come")
- Conflating feature requests with actual problems
- Only talking to power users — they're not representative
- Stopping at one user interview
- Presenting findings as "users want X" instead of "users struggle with Y because Z"
- Skipping competitive analysis
- Discovery that never ends — time-box it

---

## Checklist
- [ ] Research goals clearly defined before interviews begin
- [ ] Problem statement written (situation + motivation + outcome format)
- [ ] 5+ user interviews conducted (or equivalent research)
- [ ] Findings synthesized and themed (affinity map or similar)
- [ ] Opportunity sized (who × frequency × severity)
- [ ] Key assumptions listed and ranked by risk
- [ ] Riskiest assumption tested with an experiment
- [ ] Discovery findings documented and shared with team
- [ ] Success metric defined upfront

---

## Related Skills
- [product-requirements] — validated discovery feeds requirement writing
- [ux-research] — deep methodology partnership
- [product-metrics] — define success indicators during discovery
- [stakeholder-management] — align stakeholders on problem space before solutioning
