---
name: product-metrics
description: Defining success metrics, setting up analytics, designing A/B tests, and creating dashboards to measure product outcomes. Apply when launching features or evaluating product health.
applyTo: ["**/*.md", "**/*.yaml", "**/*.json", "**/*.ts", "**/*.js"]
teamRole: "Product"
relatedSkills:
  - product-requirements
  - product-roadmap
  - data-analytics
  - data-engineering
  - ux-research
expertise:
  - kpi-definition
  - analytics-instrumentation
  - ab-testing
  - funnel-analysis
  - dashboard-design
---

# Product Metrics Skill

## Role Overview
The Product Metrics role ensures every product decision is informed by data. This role defines what to measure, how to instrument it, and how to interpret results — closing the loop between shipping and learning.

## Core Responsibilities
- Define success metrics for features before development starts
- Design analytics event schemas and instrumentation requirements
- Plan and analyze A/B experiments with statistical rigor
- Build and maintain product dashboards (funnels, retention, activation)
- Identify metric anomalies and investigate root causes
- Translate metric changes into actionable product decisions

## Workflows

### Metric Definition Framework (HEART + GSM)

**HEART Framework** (Google):
| Dimension | Question | Example Metric |
|-----------|----------|----------------|
| **H**appiness | Are users satisfied? | NPS, CSAT, task completion satisfaction |
| **E**ngagement | Are users active? | DAU/MAU, sessions/user, feature usage rate |
| **A**doption | Are new users discovering value? | Feature adoption rate, % users using feature |
| **R**etention | Are users coming back? | Day-7 retention, monthly active users |
| **T**ask Success | Can users accomplish goals? | Completion rate, error rate, time-on-task |

**GSM (Goals → Signals → Metrics)**:
```
Goal: Users can quickly find their purchase history
Signal: User searches for and views a purchase record
Metric: Search-to-result time (p95 < 1.5s), search success rate (>85%)
```

### Instrumentation Planning
Before development starts, define the event schema:

```typescript
// Event taxonomy template
interface AnalyticsEvent {
  event_name: string;      // snake_case verb_noun: "purchase_submitted"
  timestamp: ISO8601;
  user_id: string;
  session_id: string;
  properties: {
    // Feature-specific properties
    [key: string]: string | number | boolean;
  };
  context: {
    page: string;
    platform: "web" | "mobile" | "api";
    version: string;
  };
}

// Example events for a purchase flow
"purchase_form_opened"
"purchase_form_field_changed" -> { field_name, value_length }
"purchase_form_submitted"     -> { form_fields_count, has_extra_amount }
"purchase_form_succeeded"     -> { purchase_id, total_amount_range }
"purchase_form_failed"        -> { error_type, error_message }
```

### A/B Test Design
```markdown
## Experiment: [Name]
**Hypothesis**: If we [change], then [metric] will [improve/decrease] by [X%] because [rationale]
**Primary Metric**: [metric] — minimum detectable effect: [X%]
**Guard Rail Metrics**: [metrics that must not degrade]
**Segments**: [All users / New users / Power users]
**Traffic Split**: 50/50 (or justified alternative)
**Duration**: [X days] — based on MDE calculator
**Statistical Power**: 80% | Significance: 95%
**Decision Rule**: Ship if primary metric improves AND guard rails hold
```

### Funnel Analysis Template
```
Acquisition → Activation → Retention → Revenue → Referral (AARRR)

Step 1: [Page/action] — [X]% baseline conversion
Step 2: [Page/action] — [X]% from previous step
Step 3: [Page/action] — [X]% from previous step
...
Biggest drop-off: Step N → N+1 ([X]% drop)
```

### Dashboard Design Principles
- **One primary metric per dashboard section** — don't bury the lead
- **Time series + benchmark**: Always show trend vs. target or vs. prior period
- **Cohort segmentation available**: Allow filtering by user type, platform, date cohort
- **Anomaly alerts**: Set threshold alerts for key metrics (e.g., error rate > 5%)
- **Leading vs. lagging**: Show both leading indicators (engagement) and lagging (revenue)

## Best Practices

### Defining Good Metrics
- **Specific**: "7-day retention for paying users" not just "retention"
- **Measurable**: Can be calculated from available data
- **Actionable**: A change in the metric should inform a product decision
- **Time-bound**: Always measure over a defined period
- **Counter-balanced**: Every metric should have a counter-metric (speed + accuracy, growth + retention)

### North Star Metric
Every product should have one North Star that captures delivered value:
- Too broad: "Revenue" (doesn't reflect user value)
- Too narrow: "Button clicks" (activity, not value)
- Right level: "Weekly active purchasers" (reflects product's core value delivery)

### Statistical Rigor for Experiments
- Never stop an experiment early based on peeking (use sequential testing if needed)
- Always pre-register hypothesis before running the test
- Use p-value AND confidence intervals — p < 0.05 alone is insufficient
- Account for multiple comparisons when testing many variants
- Distinguish statistical significance from practical significance

## Collaboration Patterns

### With Product Requirements
- Every user story should reference its success metric
- PM writes metric definition alongside acceptance criteria — not after launch
- Metrics are "done" criteria alongside functional requirements

### With Data Engineering
- Define event schema requirements before development starts
- Data engineers build the pipeline; PM defines what events are needed
- Validate instrumentation in staging before launch

### With Data Analytics
- Analytics runs the dashboards; PM interprets the business meaning
- Analyst flags metric anomalies; PM investigates and decides response
- Joint ownership of experiment analysis

### With UX Research
- Quantitative metrics (analytics) + qualitative insights (research) = full picture
- Research explains the "why" behind metric anomalies
- Metrics guide research focus areas ("retention dropped — let's talk to churned users")

## Anti-Patterns
- **Vanity metrics**: Page views, total signups — easy to inflate, don't reflect value
- **Metric without baseline**: "Conversion will improve" — improve from what?
- **Post-hoc metric selection**: Choosing metrics after seeing results (p-hacking)
- **Instrumentation afterthought**: Adding event tracking after launch and losing launch data
- **Dashboard overload**: 50 charts with no primary metric — analysis paralysis
- **Moving goalposts**: Changing success metrics mid-experiment
- **No guard rails**: Optimizing one metric while silently harming another

## Checklist
Before launching a feature:
- [ ] Success metric defined (primary + secondary)
- [ ] Counter-metric defined (guard rail)
- [ ] Analytics events specified and reviewed with engineering
- [ ] Instrumentation tested in staging
- [ ] Baseline measurement captured before launch
- [ ] Dashboard created or updated
- [ ] Alert thresholds configured
- [ ] Review date scheduled (1 week + 4 week after launch)

## Related Skills
- `product-requirements` — requirements must include metric definitions
- `product-roadmap` — metrics validate roadmap priorities and inform next cycle
- `data-analytics` — runs dashboards and analysis pipelines
- `data-engineering` — builds event ingestion and transformation pipelines
- `ux-research` — provides qualitative context for metric changes
