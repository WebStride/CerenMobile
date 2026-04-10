---
name: monitoring
description: Universal monitoring & observability skill covering logging, metrics, alerting, distributed tracing, incident response, and SLO/SLA management. Apply when building observability pipelines, dashboards, alert policies, or incident runbooks.
applyTo: ["**/*"]
teamRole: "DevOps"
relatedSkills:
  - devops-engineer
  - backend-engineer
  - security-operations
  - deployment-strategies
expertise:
  - logging
  - metrics
  - alerting
  - distributed-tracing
  - incident-response
  - SLO/SLA
---

# Monitoring & Observability Skill

## Role Overview
Design and maintain the observability stack so that teams can understand system behavior, detect issues proactively, and resolve incidents quickly. Monitoring is not optional — it is the foundation of production reliability.

---

## Core Responsibilities
- Define and implement the three pillars: **Logs, Metrics, Traces**
- Set up alerting with meaningful thresholds (avoid alert fatigue)
- Create runbooks for every alert
- Define SLOs (Service Level Objectives) and track error budgets
- Build dashboards that reflect real user experience
- Lead incident response and post-mortems

---

## The Three Pillars

### 1. Logs
- Use **structured JSON logging** — never plain text in production
- Include: `timestamp`, `level`, `service`, `traceId`, `userId`, `message`, `error`
- Log at the right level: ERROR for actionable issues, WARN for degraded state, INFO for key lifecycle events, DEBUG for dev only
- Centralize logs: ELK Stack, Datadog, Loki, CloudWatch, GCP Logging
- **Never log PII, secrets, or tokens**

```json
{
  "timestamp": "2026-01-15T10:30:00Z",
  "level": "error",
  "service": "payment-api",
  "traceId": "abc123",
  "userId": "usr_xxx",
  "message": "Payment processing failed",
  "error": "Card declined",
  "code": "CARD_DECLINED"
}
```

### 2. Metrics
- Use **RED method** for services: Rate, Errors, Duration
- Use **USE method** for infrastructure: Utilization, Saturation, Errors
- Key metrics to always track:
  - Request rate (req/sec)
  - Error rate (% of 5xx/4xx)
  - Latency (p50, p95, p99)
  - Saturation (CPU, memory, queue depth)
- Tools: Prometheus, Datadog, CloudWatch Metrics, Grafana

### 3. Traces
- Implement distributed tracing for any multi-service architecture
- Propagate trace context across all service boundaries
- Tools: OpenTelemetry (vendor-neutral), Jaeger, Zipkin, Datadog APM, AWS X-Ray
- Always sample: 100% for errors, 1–10% for healthy requests

---

## SLOs and Error Budgets

### Define SLOs Before Deploying to Production
```
SLO: 99.9% of requests complete within 500ms over 30 days
Error Budget: 0.1% = ~43.2 minutes/month of allowed downtime
```

### SLO Checklist
- [ ] Availability SLO defined (e.g., 99.9% uptime)
- [ ] Latency SLO defined (e.g., p95 < 500ms)
- [ ] Error rate SLO defined (e.g., < 0.1% 5xx)
- [ ] Error budget tracked and reported weekly
- [ ] Alert fires when error budget burns >5%/hour

---

## Alerting Best Practices

### Alert Hierarchy
1. **Page** (wake someone up): Production down, error budget burning fast, data loss risk
2. **Ticket** (fix during business hours): Degraded performance, elevated error rate, disk >80%
3. **Log only**: Minor anomalies, auto-recovered issues

### Rules for Good Alerts
- Every alert has a **runbook link**
- Alert fires on **symptoms** (users affected), not causes (CPU high)
- Test alerts in staging before production
- Review and prune alerts quarterly — delete unused ones
- Set alert severity: P1 (critical), P2 (high), P3 (medium)

```yaml
# Example: Prometheus alert rule
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
  for: 2m
  labels:
    severity: page
  annotations:
    summary: "High error rate on {{ $labels.service }}"
    runbook: "https://runbooks.internal/high-error-rate"
```

---

## Dashboards

### Golden Signals Dashboard (build this first)
Every service should have:
1. **Request Rate** — requests/sec over time
2. **Error Rate** — % errors over time
3. **Latency** — p50 / p95 / p99 over time
4. **Saturation** — resource utilization

### Dashboard Principles
- Top of dashboard: user-facing health (SLO status)
- Middle: service metrics
- Bottom: infrastructure metrics
- Include time range selector
- Annotate deployments on graphs

---

## Incident Response

### Incident Severity Levels
| Severity | Definition | Response Time |
|----------|-----------|---------------|
| P1 | Production down, data loss, security breach | Immediate |
| P2 | Major feature broken for all users | 15 min |
| P3 | Degraded performance or partial outage | 1 hour |
| P4 | Minor bug, affects few users | Next business day |

### Incident Lifecycle
1. **Detect** — alert fires or user reports
2. **Triage** — assign severity, assemble responders
3. **Communicate** — update status page, notify stakeholders
4. **Mitigate** — restore service (rollback, scale, circuit-break)
5. **Resolve** — root cause fixed
6. **Post-mortem** — blameless review within 48 hours

### Post-Mortem Template
```
## Incident: [title]
**Date:** | **Duration:** | **Severity:**
**Impact:** N users affected, $X revenue impact

### Timeline
- HH:MM — Event
- HH:MM — Alert fired

### Root Cause
[What actually caused this]

### Contributing Factors
[What made it worse or harder to detect]

### Action Items
| Action | Owner | Due Date |
```

---

## Observability Stack Recommendations

| Need | Tools |
|------|-------|
| Logs | Datadog, Loki+Grafana, ELK, CloudWatch |
| Metrics | Prometheus+Grafana, Datadog, CloudWatch Metrics |
| Traces | OpenTelemetry + Jaeger/Tempo, Datadog APM |
| Uptime | Pingdom, Checkly, Datadog Synthetics |
| Error tracking | Sentry, Bugsnag, Rollbar |
| Status page | Statuspage.io, Freshstatus, self-hosted |

---

## Anti-Patterns
- Logging everything at DEBUG in production — floods storage, masks real issues
- Alerts without runbooks — on-call engineer has no idea what to do
- Monitoring infrastructure metrics only — doesn't reflect user experience
- Never reviewing/pruning alerts — alert fatigue leads to ignored pages
- Using averages instead of percentiles — p99 latency reveals real user pain
- Post-mortems with blame — engineers hide future incidents

---

## Checklist — Before Going to Production
- [ ] Structured logging implemented for all services
- [ ] Metrics exported (RED method minimum)
- [ ] Distributed tracing enabled
- [ ] SLOs defined and dashboards created
- [ ] At least one alert per SLO
- [ ] Every alert has a runbook
- [ ] Incident severity levels documented
- [ ] Post-mortem process defined
- [ ] On-call rotation established
- [ ] Status page configured

---

## Collaboration Patterns
- **Backend Engineer** — instrument code with logs, metrics, traces
- **DevOps Engineer** — provision monitoring infrastructure
- **Security Operations** — audit logs, anomaly detection, SIEM integration
- **Tech Lead** — define SLOs aligned to business requirements
- **Product Manager** — translate SLOs to user experience commitments
