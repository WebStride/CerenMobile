---
name: appsec
description: Universal application security skill covering code review for vulnerabilities, SAST/DAST tooling, dependency scanning, security regression testing, and embedding security in the development team workflow. Apply when reviewing PRs for security, setting up security tooling in CI, or building security-aware features.
applyTo: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.py", "**/*.go", "**/*.java"]
teamRole: Security
relatedSkills:
  - security-engineer
  - backend-engineer
  - frontend-engineer
  - security-testing
  - devops-engineer
expertise:
  - code-review-security
  - sast-dast
  - dependency-scanning
  - secure-coding
  - xss-prevention
  - csrf-prevention
  - injection-prevention
---

# Application Security (AppSec) Skill

## Role Overview
The AppSec engineer is the security practitioner embedded in the development team. While the security engineer sets standards, AppSec implements them — reviewing PRs, configuring SAST/DAST tooling, running dependency scans, and coaching developers on secure coding patterns day-to-day.

---

## Core Responsibilities
- Review pull requests for security vulnerabilities
- Configure and maintain SAST/DAST tools in CI/CD pipeline
- Run dependency vulnerability scanning (SCA)
- Conduct security-focused code reviews
- Coach developers on secure coding patterns
- Write security regression tests
- Triage vulnerability reports from automated tooling
- Validate security fixes are complete and correct

---

## Security Code Review Checklist

### Authentication & Authorization
- [ ] Every protected route has authentication middleware
- [ ] Authorization checks user ownership of the resource (prevent IDOR)
- [ ] JWT/session tokens validated server-side, not just decoded
- [ ] Sensitive operations require re-authentication (password change, payment)
- [ ] Admin endpoints protected by role check, not just authentication

### Input Validation
- [ ] All user input validated at the API boundary (never trust client)
- [ ] File uploads: validate MIME type server-side, restrict file size, store outside webroot
- [ ] URL parameters validated and sanitized
- [ ] Zod/Joi/Yup or similar schema validation in use

### Output Encoding (XSS Prevention)
```typescript
// ❌ React dangerouslySetInnerHTML with user content
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ Let React escape automatically
<div>{userContent}</div>

// If HTML is required — use DOMPurify
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

### SQL / NoSQL Injection
```typescript
// ❌ String concatenation
const result = await db.query(`SELECT * FROM orders WHERE id = ${id}`);

// ✅ ORM or parameterized queries
const result = await prisma.order.findFirst({ where: { id, userId: session.userId } });
```

### CSRF Protection
- APIs using cookies for auth must implement CSRF protection
- SameSite=Strict or SameSite=Lax cookie attribute prevents most CSRF
- For SameSite=None (cross-origin): require CSRF token header

### Security Headers
```typescript
// Express example — use helmet
import helmet from 'helmet';
app.use(helmet()); // Sets CSP, HSTS, X-Frame-Options, etc.

// Next.js — next.config.mjs
headers: () => [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
    ],
  },
],
```

### Secrets Management
```bash
# ❌ Never — hardcoded secrets
const apiKey = "sk-live-abc123...";

# ❌ Never — secrets in git
DATABASE_URL=postgres://user:password@host/db  # in committed .env

# ✅ Always — environment variables + secrets manager
const apiKey = process.env.STRIPE_SECRET_KEY;
# Store in: AWS Secrets Manager, HashiCorp Vault, Doppler, Vercel Env Vars
```

---

## SAST/DAST Integration

### SAST (Static Analysis) — CI Setup
```yaml
# GitHub Actions — Semgrep SAST
- name: Run Semgrep
  uses: semgrep/semgrep-action@v1
  with:
    config: >
      p/javascript
      p/typescript
      p/react
      p/nodejs
      p/owasp-top-ten
  env:
    SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}
```

### Dependency Scanning — CI Setup
```yaml
# GitHub Actions — npm audit + Snyk
- name: Audit dependencies
  run: npm audit --audit-level=high

- name: Snyk scan
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Secrets Scanning
```yaml
# GitHub Actions — GitLeaks
- name: Detect secrets
  uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Common Vulnerability Patterns

### Mass Assignment
```typescript
// ❌ Passing entire request body to ORM
await prisma.use r.update({ where: { id }, data: req.body });

// ✅ Explicitly pick allowed fields
const { name, email } = req.body;
await prisma.user.update({ where: { id }, data: { name, email } });
```

### Open Redirect
```typescript
// ❌ User controls redirect URL
res.redirect(req.query.returnUrl);

// ✅ Validate against allowlist
const ALLOWED_PATHS = ['/dashboard', '/profile', '/settings'];
const returnUrl = ALLOWED_PATHS.includes(req.query.returnUrl) 
  ? req.query.returnUrl 
  : '/dashboard';
res.redirect(returnUrl);
```

### Timing Attacks on Auth
```typescript
// ❌ Short-circuits on first wrong char
if (token === expectedToken) { ... }

// ✅ Constant-time comparison
import { timingSafeEqual } from 'crypto';
const isValid = timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
```

### Insecure Direct Object Reference (IDOR)
```typescript
// ❌ No ownership check
const doc = await db.document.findById(req.params.id);

// ✅ Always scope to current user
const doc = await db.document.findFirst({
  where: { id: req.params.id, ownerId: req.user.id }
});
```

---

## Vulnerability Triage Priority

| Severity | CVSS Score | Action |
|----------|-----------|--------|
| Critical | 9.0-10.0 | Fix immediately, block release |
| High | 7.0-8.9 | Fix within 72 hours |
| Medium | 4.0-6.9 | Fix within 2 weeks |
| Low | 0.1-3.9 | Fix in next sprint |
| Info | 0.0 | Document, no immediate action |

---

## Best Practices
- Review every PR touching auth, payments, or data access for security
- Automate — SAST/DAST should run on every PR, not periodically
- Fix root cause — don't just patch; understand why the vulnerability exists
- Write a security regression test for every fixed vulnerability
- Document developer coaching — if you explain a vulnerability once, write a guide so it doesn't recur

---

## Collaboration Patterns

### With backend-engineer
- Pair on authentication and session management implementation
- Review all external API integrations for credential handling

### With frontend-engineer
- Review for XSS, insecure use of `dangerouslySetInnerHTML`
- Review third-party script loading patterns

### With devops-engineer
- Configure SAST/DAST in CI pipeline
- Set up secrets scanning as a required check before merge

---

## Tools
| Tool | Purpose |
|------|---------|
| Semgrep | SAST — semantic code analysis |
| Snyk | SCA — dependency vulnerabilities |
| OWASP ZAP | DAST — dynamic scanning |
| GitLeaks | Secrets in git history |
| npm audit / pip-audit | Package vulnerability audit |
| Burp Suite | Manual security testing |
| Socket.dev | Supply chain attack prevention |

---

## Anti-Patterns
- Treating security review as a final gate before release
- Ignoring "low" severity findings — they chain into critical exploits
- Disabling SAST warnings without documented justification
- Storing any user data without evaluating if it's necessary
- Using `eval()`, `Function()`, or `innerHTML` with user-controlled data
- Trusting `Content-Type` headers from user uploads

---

## Checklist — PR Security Review
- [ ] No secrets or credentials in code changes
- [ ] Input validation present for all new inputs
- [ ] Authorization checks correct (ownership enforced)
- [ ] No new `dangerouslySetInnerHTML` or `eval()` usage
- [ ] New dependencies checked against vulnerability DB
- [ ] Sensitive data (PII, payments) handled per policy
- [ ] SAST scan passes with no new high/critical findings

---

## Related Skills
- [security-engineer] — strategy and architecture standards
- [security-testing] — penetration testing and validation
- [backend-engineer] — secure API implementation patterns
- [frontend-engineer] — client-side security patterns
