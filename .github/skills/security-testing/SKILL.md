---
name: security-testing
description: Universal security testing skill covering OWASP Top 10 validation, penetration testing, SAST/DAST tooling, dependency scanning, and security regression testing. Apply before every release and when security requirements change.
applyTo: ["**/*"]
teamRole: "QA"
relatedSkills:
  - qa-strategy
  - security-engineer
  - appsec
  - backend-engineer
  - automation-testing
expertise:
  - owasp-top10
  - penetration-testing
  - sast-dast
  - dependency-scanning
  - auth-testing
---

# Security Testing Skill

## Role Overview
Security testers systematically probe applications for vulnerabilities — combining automated scanning with manual exploitation techniques to validate that security controls work as designed.

## Core Responsibilities
- Execute OWASP Top 10 test coverage for every release
- Run SAST/DAST scans in CI/CD pipelines
- Perform authentication and authorization testing
- Conduct dependency vulnerability scanning
- Validate input sanitization and output encoding
- Test API security (rate limiting, auth bypass, injection)
- Produce actionable security test reports

## OWASP Top 10 Test Coverage

### A01 — Broken Access Control
```
Tests:
□ Access resources of another user by modifying IDs (IDOR)
□ Access admin endpoints as regular user
□ Access authenticated routes without token
□ Modify JWT payload without re-signing
□ Test CORS policy for unauthorized origins
□ Verify rate limiting on sensitive endpoints
```

### A02 — Cryptographic Failures
```
Tests:
□ Sensitive data transmitted over HTTP (not HTTPS)
□ Passwords stored in plaintext or weak hash
□ Weak TLS versions accepted (TLS 1.0/1.1)
□ Sensitive data in logs, URLs, or error messages
□ JWT using 'none' algorithm or weak secret
```

### A03 — Injection
```
SQL Injection:
□ ' OR '1'='1  in all input fields
□ UNION SELECT attacks on search endpoints
□ Blind SQLi via time-based payloads

Command Injection:
□ ; ls -la, | whoami in file path inputs
□ Template injection: {{7*7}}, ${7*7}

XSS:
□ <script>alert(1)</script> in all inputs
□ Stored XSS via user-controlled content
□ DOM-based XSS via URL parameters
```

### A04 — Insecure Design
```
Tests:
□ Business logic flows can be skipped/reordered
□ Price manipulation in cart/checkout
□ Quantity/discount bypass via request tampering
□ Password reset flow bypasses verification step
```

### A05 — Security Misconfiguration
```
Tests:
□ Default credentials (admin/admin, test/test)
□ Directory listing enabled
□ Detailed error messages expose stack traces
□ HTTP security headers missing (CSP, HSTS, X-Frame)
□ Unnecessary HTTP methods enabled (PUT, DELETE on public endpoints)
□ CORS allows * or unintended origins
```

### A06 — Vulnerable Components  
```
Tools: npm audit, Snyk, OWASP Dependency Check
Tests:
□ All dependencies at non-critical vulnerability version
□ No end-of-life frameworks or libraries
□ Direct + transitive dependencies scanned
```

### A07 — Authentication Failures
```
Tests:
□ Account enumeration via different error messages
□ Brute force not rate limited or locked
□ Weak password policy (min length, complexity)
□ "Remember me" tokens not rotating on logout
□ Session tokens predictable or exposed in logs
□ MFA can be bypassed
```

### A08 — Software/Data Integrity Failures
```
Tests:
□ Unsigned code/data updates accepted
□ Deserialization of untrusted data without validation
□ CDN scripts loaded without SRI attributes
```

### A09 — Logging and Monitoring Failures
```
Tests:
□ Login failures not logged
□ Admin actions not logged
□ No alerts for repeated auth failures
□ PII/credentials appear in logs
□ Logs are accessible to regular users
```

### A10 — Server-Side Request Forgery (SSRF)
```
Tests:
□ URL input fields request internal IPs (192.168., 10., 169.254.)
□ File upload URLs resolve to internal services
□ Webhooks can target internal endpoints
□ DNS rebinding attack paths
```

## SAST/DAST Tooling

### SAST (Static Analysis) — Run in CI
```yaml
# GitHub Actions SAST example
- name: CodeQL Analysis
  uses: github/codeql-action/analyze@v3
  with:
    languages: javascript, typescript

- name: Semgrep SAST
  uses: semgrep/semgrep-action@v1
  with:
    config: p/owasp-top-ten
```

### DAST (Dynamic Analysis) — Run against staging
```bash
# OWASP ZAP baseline scan
docker run -v $(pwd):/zap/wrk owasp/zap2docker-stable zap-baseline.py \
  -t https://staging.yourapp.com \
  -r zap-report.html \
  -l WARN

# ZAP full scan (pre-release)
docker run owasp/zap2docker-stable zap-full-scan.py \
  -t https://staging.yourapp.com \
  -r full-scan-report.html
```

### Dependency Scanning
```bash
# npm
npm audit --audit-level=high
npx snyk test

# Python
pip-audit
safety check

# GitHub Dependabot (configure in .github/dependabot.yml)
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
```

## API Security Testing

### Auth Bypass Tests
```bash
# Test without token
curl -X GET https://api.example.com/admin/users

# Test with expired token
curl -H "Authorization: Bearer expired.jwt.token" \
  https://api.example.com/protected

# Test with tampered JWT (change role claim)
# Decode → modify payload → re-encode with same signature
```

### Rate Limit Validation
```bash
# Send 100 requests in 10 seconds — should be rate limited
for i in {1..100}; do
  curl -s -o /dev/null -w "%{http_code}" \
    https://api.example.com/auth/login \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo
done | sort | uniq -c
# Expected: 429 responses appearing before 100 requests
```

### HTTP Security Headers Checklist
```
Header                        | Expected Value
──────────────────────────────|─────────────────────────────────
Strict-Transport-Security     | max-age=63072000; includeSubDomains
Content-Security-Policy       | default-src 'self'
X-Frame-Options               | DENY or SAMEORIGIN
X-Content-Type-Options        | nosniff
Referrer-Policy               | strict-origin-when-cross-origin
Permissions-Policy            | camera=(), microphone=()
```

Use: `curl -I https://yourapp.com` or https://securityheaders.com

## Security Regression Testing

### Security Test Suite in CI
```javascript
// security.spec.ts — runs in CI on every PR
describe('Security Regression', () => {
  test('auth endpoints require valid token', async () => {
    const res = await fetch('/api/user/profile')
    expect(res.status).toBe(401)
  })

  test('admin routes blocked for regular users', async () => {
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${userToken}` }
    })
    expect(res.status).toBe(403)
  })

  test('SQL injection returns 400 not 500', async () => {
    const res = await fetch("/api/search?q=' OR 1=1--")
    expect(res.status).toBe(400)
    expect(await res.text()).not.toContain('SQL')
  })
})
```

## Security Test Report Template
```
## Security Test Report — [Version] — [Date]
### Status: CLEAR / FINDINGS

Critical findings: 0
High findings: 0
Medium findings: 2
Low findings: 5

### Findings
[MEDIUM] IDOR on /api/invoices/:id — any user can access any invoice
  Reproduction: GET /api/invoices/999 as user with id 1
  Recommendation: Add user ownership check before returning data

### OWASP Coverage
A01 Broken Access Control:  ✅ PASS
A02 Cryptographic Failures: ✅ PASS
A03 Injection:              ✅ PASS
...
```

## Collaboration Patterns

### With Backend Engineers
- Share injection/auth test payloads for code review context
- Request security fixes on a separate security branch
- Validate fixes in isolation before full regression

### With Security Engineers
- Escalate Critical/High findings immediately
- Share raw scan reports for triage
- Align on false positive classification

### With DevOps
- Confirm SAST/DAST runs in CI/CD pipeline
- Verify secret scanning is enabled on all repos
- Validate infrastructure-level security controls

## Anti-Patterns to Avoid
- **Security testing only at release** — must be continuous in CI
- **Only running automated scans** — manual pen testing required for business logic flaws
- **Ignoring medium/low findings** — they chain into critical vulnerabilities
- **Testing against production** — always staging with prod-like data
- **Treating security as a separate phase** — security requirements must be in PRD from day one
