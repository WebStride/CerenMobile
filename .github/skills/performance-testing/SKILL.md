---
name: performance-testing
description: Universal performance testing skill covering load testing, stress testing, benchmarking, Core Web Vitals profiling, and capacity planning. Apply before major releases or when investigating performance degradation.
applyTo: ["**/*"]
teamRole: "QA"
relatedSkills:
  - qa-strategy
  - frontend-performance
  - backend-engineer
  - devops-engineer
  - monitoring
expertise:
  - load-testing
  - stress-testing
  - benchmarking
  - profiling
  - capacity-planning
---

# Performance Testing Skill

## Role Overview
Performance engineers validate that systems meet latency, throughput, and stability requirements under expected and extreme load — before users discover the limits in production.

## Core Responsibilities
- Define performance SLAs and acceptance criteria
- Design and execute load, stress, soak, and spike tests
- Profile application bottlenecks (CPU, memory, I/O, DB)
- Measure and report Core Web Vitals for frontend
- Establish performance baselines and regression gates
- Collaborate with DevOps on infrastructure capacity planning

## Performance Test Types

| Type | Goal | When to Run |
|------|------|------------|
| **Baseline** | Measure current state | Before any optimization |
| **Load** | Validate at expected concurrency | Every release |
| **Stress** | Find breaking point | Before major launches |
| **Soak/Endurance** | Find memory leaks, degradation over time | Weekly on staging |
| **Spike** | Validate sudden traffic burst handling | Pre-launch campaigns |
| **Capacity** | Project resource needs for growth | Quarterly planning |

## SLA Definition Framework

### Server-Side SLAs
```
Metric          | Target          | Threshold
────────────────|─────────────────|──────────
P50 latency     | < 100ms         | < 200ms
P95 latency     | < 300ms         | < 500ms
P99 latency     | < 800ms         | < 1000ms
Error rate      | < 0.1%          | < 0.5%
Throughput      | > 1000 req/s    | > 500 req/s
CPU utilization | < 70% at peak   | < 85%
Memory          | No growth >5%   | Stable over soak
```

### Frontend SLAs (Core Web Vitals)
```
Metric | Good    | Needs Improvement | Poor
───────|─────────|───────────────────|──────
LCP    | < 2.5s  | 2.5–4.0s          | > 4.0s
FID/INP| < 100ms | 100–300ms         | > 300ms
CLS    | < 0.1   | 0.1–0.25          | > 0.25
TTFB   | < 800ms | 800ms–1.8s        | > 1.8s
FCP    | < 1.8s  | 1.8–3.0s          | > 3.0s
```

## Load Testing with k6

### Basic Load Test Script
```javascript
// load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // ramp up
    { duration: '5m', target: 50 },   // hold at 50 VUs
    { duration: '2m', target: 100 },  // ramp to peak
    { duration: '5m', target: 100 },  // hold at peak
    { duration: '2m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    errors: ['rate<0.01'],             // < 1% errors
  },
}

export default function () {
  const res = http.get('https://api.example.com/health')
  check(res, {
    'status is 200': (r) => r.status === 200,
    'duration < 200ms': (r) => r.timings.duration < 200,
  })
  errorRate.add(res.status !== 200)
  sleep(1)
}
```

### Scenario Modeling
```javascript
// Realistic user journey test
export const options = {
  scenarios: {
    browse_products: {
      executor: 'constant-vus',
      vus: 80,
      duration: '10m',
      exec: 'browseProducts',
    },
    checkout: {
      executor: 'constant-vus',
      vus: 20,
      duration: '10m',
      exec: 'completePurchase',
    },
  },
}
```

## Frontend Performance Profiling

### Lighthouse CI Integration
```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_TOKEN }}
```

### Lighthouse CI Config
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/', 'http://localhost:3000/dashboard'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
}
```

### Chrome DevTools Profiling Steps
1. Open DevTools → Performance tab
2. Enable CPU throttling (4x slowdown for mobile simulation)
3. Enable Network throttling (Fast 3G)
4. Click Record → perform user action → Stop
5. Analyze: Long Tasks (> 50ms), Layout Thrashing, Unused JS

## Database Performance Testing

### Query Analysis Checklist
- [ ] `EXPLAIN ANALYZE` run on all queries > 100ms
- [ ] N+1 query patterns detected and resolved
- [ ] Indexes exist for all filtered/sorted columns
- [ ] Connection pool size appropriate for concurrent load
- [ ] Slow query log enabled and monitored

### Connection Pool Stress Test
```javascript
// Test DB connection limits
export const options = {
  stages: [
    { duration: '1m', target: 200 },  // spike to 200 connections
    { duration: '2m', target: 200 },  // hold
    { duration: '1m', target: 0 },    // release
  ],
}
```

## Performance Regression Gates

### CI Integration
```yaml
# Block PR if performance degrades > 20%
- name: Performance Regression Check
  run: |
    CURRENT=$(cat perf-results/p95-latency.txt)
    BASELINE=$(cat perf-baseline/p95-latency.txt)
    DEGRADATION=$(echo "scale=2; ($CURRENT - $BASELINE) / $BASELINE * 100" | bc)
    if (( $(echo "$DEGRADATION > 20" | bc -l) )); then
      echo "Performance regression detected: ${DEGRADATION}%"
      exit 1
    fi
```

## Reporting Format

### Performance Test Report Structure
```
## Performance Test Report — [Date]
### Summary: PASS / FAIL

Test: [Load test at 100 VUs for 10 minutes]
Baseline: P95 = 280ms | Error rate = 0.05%
Current:  P95 = 312ms | Error rate = 0.08%
Delta:    +11.4% latency | +60% error rate

### Findings
1. [CRITICAL] Endpoint /api/checkout P99 exceeds 1s SLA
2. [WARNING] DB connection pool saturation at 150+ VUs

### Recommendations
1. Add index on orders.created_at
2. Increase connection pool from 10 to 25
```

## Collaboration Patterns

### With Backend Engineers
- Share profiling flamegraphs for bottleneck investigation
- Request query execution plans for slow endpoints
- Agree on connection pool sizing and caching strategies

### With DevOps
- Coordinate infrastructure scaling tests with production-like setup
- Share load test results to inform auto-scaling policies
- Align on monitoring dashboards to track performance in prod

### With Frontend Engineers
- Share Lighthouse CI results and Core Web Vitals regressions
- Identify large bundles, unused code, render-blocking resources
- Pair on performance budgets in CI

## Anti-Patterns to Avoid
- **Testing in non-prod environments only** — production has different characteristics
- **Testing only happy paths** — include search, pagination, and complex queries
- **Ignoring warm-up** — always warm up the JIT / connection pools before measuring
- **One-time performance testing** — must be continuous with regression gates
- **Load testing in production during business hours** — always off-peak or staging
- **Treating P50 as the full story** — always report P95 and P99
