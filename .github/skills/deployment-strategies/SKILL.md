---
name: deployment-strategies
description: Universal deployment strategies skill covering blue-green deployments, canary releases, feature flags, rollback procedures, and release engineering. Apply when planning release approaches, designing deployment pipelines, or minimizing production risk.
applyTo: ["**/*.yml", "**/*.yaml", "**/*.json", "**/Dockerfile*", "**/*.sh"]
teamRole: DevOps
relatedSkills:
  - devops-engineer
  - containerization
  - monitoring
  - qa-strategy
expertise:
  - blue-green-deployments
  - canary-releases
  - feature-flags
  - rollback-procedures
  - release-engineering
  - zero-downtime-deploys
---

# Deployment Strategies Skill

## Role Overview
The deployment strategist designs release processes that minimize risk, enable fast rollbacks, and eliminate downtime. Responsible for selecting the right deployment pattern per use case, configuring release pipelines, and ensuring every release is reversible.

---

## Core Responsibilities
- Design zero-downtime deployment strategies
- Implement feature flags for incremental rollouts
- Configure canary and blue-green pipelines
- Define rollback triggers and runbooks
- Coordinate release schedules with product and engineering
- Verify deployment health automatically post-release
- Maintain environment parity (dev/staging/prod)
- Document go/no-go criteria for every release

---

## Deployment Patterns

### Blue-Green Deployment
Two identical environments; traffic switches instantly between them.

```
Traffic → Load Balancer → Blue (active) 
                        → Green (idle/next release)

Steps:
1. Deploy new version to Green (idle)
2. Run smoke tests on Green
3. Switch load balancer to Green (instant cutover)
4. Keep Blue warm for 15-30 min (fast rollback)
5. Decommission or reuse Blue
```

**Best for:** Stateless services, critical APIs, when instant rollback is required.
**Trade-off:** Requires 2× infrastructure cost.

---

### Canary Release
Route a small % of traffic to new version, monitor, then gradually increase.

```
Traffic → Load Balancer → v1 (95%)
                        → v2 canary (5%)
                              ↓ metrics OK?
                        → v2 (50%)
                              ↓ metrics OK?
                        → v2 (100%)
```

**Best for:** High-traffic services where you want real-world validation.
**Monitor during canary:** error rate, latency p99, business metrics.
**Auto-rollback trigger:** error rate > baseline + 1%, or latency degrades > 20%.

---

### Rolling Deployment
Replace instances one at a time (or in batches) without full cutover.

```
[v1][v1][v1][v1]  → start
[v2][v1][v1][v1]  → batch 1 deployed
[v2][v2][v1][v1]  → batch 2 deployed
[v2][v2][v2][v2]  → complete
```

**Best for:** Kubernetes workloads (default strategy).
**Configure:** `maxUnavailable: 0` + `maxSurge: 1` for zero-downtime rolling.

---

### Feature Flags
Decouple deployment from release. Ship code dark, enable for specific users.

```typescript
// Example pattern — framework-agnostic
if (featureFlags.isEnabled('new-checkout-flow', user)) {
  return renderNewCheckout();
}
return renderLegacyCheckout();
```

**Lifecycle:** Dark launch → Internal testing → Beta users → % rollout → GA → Flag cleanup
**Tools:** LaunchDarkly, Flagsmith, Unleash, Vercel Edge Config, PostHog feature flags
**Rule:** Every flag has an owner + expiry date. Flags accumulate as tech debt if not cleaned up.

---

### Database Migration Strategy

Deploy in 3 phases to handle schema changes safely:

```
Phase 1: Add new column (nullable, backward compatible)
Phase 2: Deploy code that reads/writes both old+new column
Phase 3: Backfill data, make column required, remove old column
```

**Never:** Drop columns or change types in the same deploy as code changes.
**Always:** Test migration rollback before production.

---

## Rollback Procedures

### Automated Rollback Triggers
Define go/no-go metrics that trigger auto-rollback:

```yaml
# Example health gate
deployment:
  healthGates:
    - metric: error_rate
      threshold: "< 1%"
      window: 5m
    - metric: p99_latency
      threshold: "< 500ms"
      window: 5m
    - metric: apdex_score
      threshold: "> 0.9"
      window: 5m
  rollbackOn: any_gate_failed
```

### Manual Rollback Runbook
1. Identify failing deployment (check monitoring alerts)
2. Assess impact (what % of users affected?)
3. Decision: rollback or hotfix? (rule: rollback if > 5 min to fix)
4. Execute rollback command:
   - Kubernetes: `kubectl rollout undo deployment/<name>`
   - Docker Compose: revert image tag + `docker compose up -d`
   - Vercel/Netlify: activate previous deployment from dashboard
5. Verify rollback succeeded (smoke tests + monitoring)
6. Communicate status to stakeholders
7. Write incident report within 24h

---

## Best Practices

### Before Any Release
- [ ] Deployment tested in staging with production-parity data
- [ ] Migration rollback tested
- [ ] Feature flags configured (not hardcoded)
- [ ] Health gates defined
- [ ] Rollback runbook reviewed
- [ ] On-call engineer identified

### Release Engineering
- **Ship small, ship often** — large releases = large risk
- Every deployment must be **reversible within 5 minutes**
- **Separate deploy from release** using feature flags for risky changes
- **Never deploy on Fridays** or before holidays unless absolutely required
- Maintain a **deployment freeze window** around major business events (product launches, Black Friday)
- All production changes require a **deployment record** (what, who, when, why)

### Environment Parity
- Dev → Staging → Production must use identical infrastructure configs
- Use **environment variables** for all env-specific config — never hardcode
- Staging should receive **production traffic shadows** periodically for realistic tests

---

## Collaboration Patterns

### With devops-engineer
- Handoff: DevOps builds the pipeline, Deployment Strategies defines the pattern
- Review deployment pipeline configs together before production

### With monitoring
- Define health gates and rollback triggers collaboratively
- Confirm dashboards are live before any major release

### With qa-strategy
- QA defines the smoke test suite that gates deployment promotion
- Performance testing gates canary progression

### With product-requirements
- Coordinate feature flag rollout % with product's launch strategy
- Align deployment schedule with marketing / customer commitments

---

## Tools & Technologies
| Tool | Purpose |
|------|---------|
| GitHub Actions / GitLab CI | Deployment pipeline automation |
| ArgoCD / Flux | GitOps-based Kubernetes deployments |
| Helm | Kubernetes release management |
| LaunchDarkly / Unleash | Feature flag management |
| Spinnaker | Multi-cloud deployment orchestration |
| Vercel / Netlify | Platform deployments with instant rollback |
| Terraform | Infrastructure-as-code for environment management |

---

## Anti-Patterns
- Deploying directly to production without staging validation
- No rollback plan ("we'll figure it out if it breaks")
- Deploying database migrations and application code simultaneously
- Long-lived feature flags that never get cleaned up
- Manual deployments with no audit trail
- Skipping health gate verification after deployment
- Letting deployments accumulate (batch releasing weeks of changes)

---

## Checklist — Pre-Deploy
- [ ] Staging smoke tests pass
- [ ] Database migrations tested (forward + rollback)
- [ ] Feature flags configured for this release
- [ ] Monitoring dashboards ready
- [ ] Health gates defined and automated
- [ ] Rollback command documented in deployment record
- [ ] On-call engineer assigned

## Checklist — Post-Deploy
- [ ] Health gates green for 15 minutes post-deploy
- [ ] Key business metrics stable (conversion, error rate, latency)
- [ ] No unexpected spike in support tickets
- [ ] Deployment record updated (success/failure + notes)

---

## Related Skills
- [devops-engineer] — pipeline infrastructure
- [monitoring] — health gates and alert configuration
- [containerization] — Kubernetes deployment mechanics
- [qa-strategy] — smoke tests and promotion gates
