---
name: data-analytics
description: Universal data analytics skill covering SQL querying, BI tooling, dashboard design, KPI definition, and communicating insights to stakeholders. Apply when building dashboards, defining metrics, writing analytical queries, or translating data into product decisions.
applyTo: ["**/*.sql", "**/analytics/**", "**/reports/**", "**/dashboards/**"]
teamRole: "Data"
relatedSkills:
  - data-engineering
  - data-governance
  - product-metrics
  - data-science
expertise:
  - SQL and query optimization
  - BI tools (Tableau, Looker, Metabase, Power BI)
  - KPI definition and metric frameworks
  - Dashboard design and data visualization
  - A/B test analysis and statistical significance
  - Stakeholder reporting
---

# Data Analytics Skill

## Role Overview
The Data Analyst bridges raw data and business decisions. You translate complex datasets into clear, actionable insights — defining metrics, building dashboards, and communicating findings with precision and clarity.

## Core Responsibilities
- Define, document, and maintain KPIs and business metrics
- Write and optimize SQL queries for analytical workloads
- Build and maintain dashboards in BI tools
- Conduct ad-hoc analyses to answer business questions
- Design and evaluate A/B tests and experiments
- Present findings to non-technical stakeholders

## Analytical Workflow

### 1. Define the Question
Before writing a single query, clarify:
- What decision will this analysis inform?
- Who is the audience — executive, PM, engineer?
- What actions change based on the answer?
- What is "good enough" accuracy for this decision?

### 2. Understand the Data
```sql
-- Profile the dataset before assuming it's clean
SELECT
  COUNT(*) AS total_rows,
  COUNT(DISTINCT user_id) AS unique_users,
  MIN(created_at) AS earliest_date,
  MAX(created_at) AS latest_date,
  SUM(CASE WHEN revenue IS NULL THEN 1 ELSE 0 END) AS null_revenue_count
FROM orders;
```

### 3. Write the Query
```sql
-- Use CTEs for readability over deeply nested subqueries
WITH active_users AS (
  SELECT DISTINCT user_id
  FROM events
  WHERE event_date >= CURRENT_DATE - INTERVAL '30 days'
    AND event_type = 'session_start'
),
user_revenue AS (
  SELECT
    o.user_id,
    SUM(o.revenue) AS total_revenue,
    COUNT(o.id) AS order_count
  FROM orders o
  WHERE o.status = 'completed'
  GROUP BY o.user_id
)
SELECT
  au.user_id,
  COALESCE(ur.total_revenue, 0) AS revenue_30d,
  COALESCE(ur.order_count, 0) AS orders_30d
FROM active_users au
LEFT JOIN user_revenue ur ON au.user_id = ur.user_id;
```

### 4. Validate Findings
- Cross-check totals against known benchmarks
- Test edge cases: nulls, date boundary conditions, duplicate rows
- Confirm grain of the data matches intended analysis
- Check for sampling bias in experimental analyses

### 5. Communicate Insights
- Lead with the "so what" — business implication first
- Provide data context (timeframe, filters, caveats)
- Use visualizations appropriate to the question type
- Include confidence level and data limitations

## KPI Framework

### Metric Definition Template
Every metric should have a formal definition:
```yaml
metric_name: monthly_active_users
description: Unique users who performed at least one session in the calendar month
owner: product_team
data_source: events table
calculation: COUNT(DISTINCT user_id) WHERE event_type = 'session_start' AND month = target_month
filters: exclude test accounts, exclude bot traffic
refresh_cadence: daily
historical_data_from: 2023-01-01
```

### Metric Hierarchy
- **North Star Metric** — single metric that best captures product value
- **Level 1 (Pillars)** — 3–5 metrics directly tied to NS metric
- **Level 2 (Diagnostic)** — metrics that explain changes in L1 metrics
- **Level 3 (Health)** — operational metrics (latency, error rate, data freshness)

### Common Metric Types
| Type | Example | Pitfall |
|------|---------|---------|
| Ratio | Conversion rate | Numerator/denominator both changing |
| Cumulative | Total revenue | Obscures trend direction |
| Rate of Change | Week-over-week growth | Noisy for small cohorts |
| Funnel | Checkout completion rate | Attribution errors |
| Cohort | 30-day retention by signup month | Survivorship bias |

## Dashboard Design Principles

### Audience-First Design
- **Executive dashboard**: 3–5 KPIs, trend direction, no raw counts
- **Operational dashboard**: Real-time or hourly data, anomaly highlighting
- **Analytical dashboard**: Drill-down capability, filter controls, comparative views

### Visual Best Practices
- Use bar charts for comparisons, line charts for trends, scatter for correlations
- Always label axes with units (%, count, $, ms)
- Show sample size when presenting rates or averages
- Use consistent colors: primary metric = brand color, comparisons = neutral
- Never use 3D charts — they distort perception

### Dashboard Structure
```
Header: Title, date range picker, last updated timestamp
Row 1: 4 KPI tiles (current value + trend vs prior period)
Row 2: Primary trend chart (time series, weekly granularity)
Row 3: Breakdown charts (by segment, cohort, geography)
Footer: Data source, methodology notes, owner contact
```

## A/B Test Analysis

### Pre-Analysis Checklist
- [ ] Sample size calculation completed (minimum detectable effect defined)
- [ ] Test and control groups are mutually exclusive
- [ ] Experiment ran for at least 2 full business cycles (avoid novelty effect)
- [ ] No SRM (Sample Ratio Mismatch) detected

### Statistical Framework
```python
from scipy import stats
import numpy as np

def ab_test_significance(control_conversions, control_n, 
                          treatment_conversions, treatment_n,
                          alpha=0.05):
    """Two-proportion z-test for conversion rate A/B test."""
    p_control = control_conversions / control_n
    p_treatment = treatment_conversions / treatment_n
    
    # Pooled proportion
    p_pool = (control_conversions + treatment_conversions) / (control_n + treatment_n)
    
    # Standard error
    se = np.sqrt(p_pool * (1 - p_pool) * (1/control_n + 1/treatment_n))
    
    # Z-score
    z = (p_treatment - p_control) / se
    
    # Two-tailed p-value
    p_value = 2 * (1 - stats.norm.cdf(abs(z)))
    
    return {
        "control_rate": p_control,
        "treatment_rate": p_treatment,
        "lift": (p_treatment - p_control) / p_control,
        "p_value": p_value,
        "significant": p_value < alpha,
        "confidence": 1 - p_value
    }
```

### Reporting Results
Always include:
1. Metric impact (absolute and relative change)
2. Statistical significance (p-value, confidence interval)
3. Practical significance (is the effect size meaningful for business?)
4. Secondary metrics (any guardrail metric regressions?)
5. Recommendation with rationale

## SQL Best Practices

### Performance
```sql
-- Filter early, aggregate late
WITH filtered AS (
  SELECT user_id, event_type, created_at
  FROM events
  WHERE created_at >= '2024-01-01'  -- Push filter before join
    AND event_type IN ('purchase', 'add_to_cart')
)
SELECT
  event_type,
  DATE_TRUNC('week', created_at) AS week,
  COUNT(*) AS event_count
FROM filtered
GROUP BY 1, 2;

-- Use window functions instead of self-joins
SELECT
  user_id,
  created_at,
  SUM(revenue) OVER (
    PARTITION BY user_id 
    ORDER BY created_at 
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_revenue
FROM orders;
```

### Readability
- One column per line in SELECT
- Uppercase SQL keywords
- CTEs over subqueries for anything > 2 levels deep
- Comment the "why" not the "what"
- Name CTEs by their grain (`user_level`, `daily_summary`)

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Reporting averages without distribution | Hides outlier effects | Add median, P90, P99 |
| Cherry-picking date ranges | Post-hoc bias | Pre-register analysis window |
| Ignoring statistical power | Underpowered tests call noise as signal | Run sample size calc first |
| Vanity metrics | Look good but don't drive decisions | Link every metric to a decision |
| Dashboard sprawl | 30 dashboards, none maintained | Single source of truth per domain |
| Excluding NULLs silently | Distorts denominators | Always document null handling |

## Collaboration Patterns

### With Data Engineers
- Provide query requirements before asking for new tables
- Review model definitions — confirm grain and join logic match your mental model
- Flag data quality issues upstream, not at reporting layer

### With Product Managers
- Challenge vague requests: "how are users doing?" → "which users? which behavior? for what decision?"
- Surface unexpected findings proactively — don't wait to be asked
- Always include "what would change this?" in your analysis

### With Engineering
- Share query plans for large analytical workloads — coordinate with indexing
- Request event tracking additions with specific schema, not vague requirements  
- Flag instrumentation gaps before sprint ends, not post-launch

### With Executives / Leadership
- One-page summary max: headline finding, supporting data, recommendation
- Anticipate "so what?" and answer it in slide 1
- Know your data lineage — you will be questioned on methodology

## Analytics Checklist

### Before Publishing a Dashboard
- [ ] Metric definitions documented with data source + logic
- [ ] Date range and filter defaults make sense for the audience
- [ ] Numbers cross-checked against a known-good source
- [ ] Null and zero handling verified
- [ ] Dashboard owner and refresh cadence visible
- [ ] Access permissions set correctly

### Before Sharing an Analysis
- [ ] Question clearly stated at the top
- [ ] Data source and time range documented
- [ ] Key assumptions listed
- [ ] Statistical validity confirmed (where applicable)
- [ ] At least one "sanity check" run (does the total match expectations?)
- [ ] Caveats and limitations disclosed

### Before Shipping an A/B Test Result
- [ ] SRM check run and passed
- [ ] Minimum run duration met (2 business cycles)
- [ ] Primary metric + guardrails all checked
- [ ] Segmentation analysis run (does lift vary by user type?)
- [ ] Recommendation stated with confidence level
