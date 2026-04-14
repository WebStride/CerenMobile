---
name: ux-design
description: Universal UX design skill covering user flows, wireframing, information architecture, usability principles, and design handoff. Apply when designing new features, auditing existing UX, or translating user research into product decisions. Reads design.md for brand context.
applyTo: ["**/*.md", "**/*.tsx", "**/*.jsx"]
teamRole: Design
relatedSkills:
  - ui-design
  - ux-research
  - accessibility-design
  - interaction-design
  - product-requirements
  - frontend-engineer
expertise:
  - user-flows
  - wireframing
  - information-architecture
  - usability-heuristics
  - design-handoff
---

# UX Design Skill

## Activation

Before starting, read `.github/design.md` for brand context, design system, and animation guidelines. If Miro is available, ask the user for a Miro board link and use Miro MCP to explore existing flows.

---

## Role Overview

UX Designers translate user needs and business goals into intuitive product experiences. They bridge research insights and visual design, ensuring every interaction is purposeful, learnable, and efficient.

---

## Core Responsibilities

- Map user journeys and identify pain points
- Design information architecture and navigation flows
- Create wireframes and low-fidelity prototypes
- Define interaction models and mental models
- Write UX specifications for engineering handoff
- Establish usability criteria and acceptance criteria

---

## Design Process

### 1. Discovery
- Clarify the user problem: WHO is affected, WHAT do they need, WHY does it matter
- Ask: "What is the user trying to accomplish? What is their current workaround?"
- Read `.github/design.md` for brand/design system constraints
- Request Miro board link if product flows exist: "Do you have a Miro board or existing flow diagrams I should reference?"

### 2. Information Architecture
- Map all screens/states required for the feature
- Define navigation hierarchy: primary, secondary, tertiary
- Identify shared components vs unique screens
- Document edge cases: empty states, error states, loading states, edge inputs

### 3. User Flows
- Draw happy path first, then exception flows
- Use standard flow notation: rectangles (screens), diamonds (decisions), ovals (start/end)
- Label every branch with the trigger condition
- Reference Miro MCP to create or update flow diagrams when available

### 4. Wireframing
- Start with low-fidelity (boxes, labels, no color)
- Annotate intent, not appearance (e.g., "primary CTA" not "big green button")
- Design for the smallest supported viewport first (mobile-first)
- Deliver in Figma, Miro, or annotated markdown spec

### 5. Handoff
- Provide redlines or Figma Dev Mode exports
- Write interaction notes for every micro-state
- Specify loading, error, success, and empty states for every data-dependent UI
- Link to corresponding user story / acceptance criteria

---

## Usability Heuristics (Nielsen)

Always evaluate designs against these 10 principles:

1. **Visibility of system status** — Users always know what's happening
2. **Match between system and real world** — Speak the user's language
3. **User control and freedom** — Easy undo and escape paths
4. **Consistency and standards** — Follow platform conventions
5. **Error prevention** — Design to prevent mistakes before they happen
6. **Recognition over recall** — Minimize memory load
7. **Flexibility and efficiency** — Shortcuts for expert users
8. **Aesthetic and minimalist design** — Remove irrelevant information
9. **Error recovery** — Clear, helpful error messages
10. **Help and documentation** — Easy-to-find contextual help

---

## Deliverables by Phase

| Phase | Deliverable |
|-------|-------------|
| Discovery | Problem statement, user personas summary |
| IA | Site map, navigation hierarchy doc |
| Wireframes | Low-fi wireframes with annotations |
| Prototype | Clickable prototype (Figma/Miro) |
| Spec | UX spec with interaction notes, edge cases |
| Handoff | Figma with Dev Mode, annotated states |

---

## Collaboration Patterns

- **with product-requirements**: Align on acceptance criteria before wireframing
- **with ux-research**: Validate flows against user research findings
- **with ui-design**: Hand off wireframes with layout intent, let UI own visual layer
- **with accessibility-design**: Flag WCAG concerns during wireframe review
- **with interaction-design**: Define motion/transition rules for key flows
- **with frontend-engineer**: Review component feasibility during wireframe phase, not after

---

## Anti-Patterns

- Jumping to high-fidelity before flows are validated
- Designing only the happy path — forgetting errors, empty states, loading
- Specifying visual details in UX phase (color, exact fonts) — that's UI design
- Handing off without interaction notes
- Ignoring mobile viewport during desktop-first wireframing
- Skipping content strategy — layout without real copy is misleading

---

## Checklist Before Handoff

- [ ] All user flows mapped including exception paths
- [ ] Empty, loading, error, and success states designed
- [ ] Mobile viewport addressed
- [ ] Annotated wireframes with interaction intent
- [ ] Acceptance criteria linked to each screen
- [ ] Accessibility notes flagged (focus order, tap targets, labels)
- [ ] Reviewed with product-requirements for scope alignment
- [ ] Miro board or Figma link shared with team
