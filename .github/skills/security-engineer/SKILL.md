---
name: security-engineer
description: Universal security engineering skill covering threat modeling, OWASP Top 10, secure SDLC, vulnerability management, and security architecture review. Apply when designing new systems, reviewing existing code for security, or responding to security incidents.
applyTo: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.py", "**/*.go", "**/*.java", "**/*.yml", "**/*.yaml"]
teamRole: Security
relatedSkills:
  - appsec
  - infrastructure-security
  - backend-engineer
  - devops-engineer
  - security-testing
expertise:
  - threat-modeling
  - owasp-top-10
  - secure-sdlc
  - vulnerability-management
  - security-architecture
  - incident-response
---

# Security Engineer Skill

## Role Overview
The security engineer embeds security into every phase of the software development lifecycle. Responsible for threat modeling, identifying vulnerabilities before they reach production, establishing secure coding standards, and leading incident response. Security is not a phase — it's a continuous practice.

---

## Core Responsibilities
- Conduct threat modeling for new features and system designs
- Review code for OWASP Top 10 and CWE vulnerabilities
- Define and enforce secure coding standards
- Run or coordinate penetration testing
- Triage and remediate security vulnerabilities
- Manage security tooling (SAST, DAST, SCA, secrets scanning)
- Lead security incident response
- Train engineering teams on secure coding practices

---

## Threat Modeling

### STRIDE Framework
For every new system or significant feature:

| Threat | Description | Example |
|--------|-------------|---------|
| **S**poofing | Impersonating another user/system | Forged JWT tokens |
| **T**ampering | Modifying data in transit or at rest | SQL injection |
| **R**epudiation | Denying an action occurred | Missing audit logs |
| **I**nformation Disclosure | Exposing sensitive data | API leaking PII |
| **D**enial of Service | Making system unavailable | Rate limit bypass |
| **E**levation of Privilege | Gaining unauthorized access | IDOR vulnerability |

### Threat Modeling Process
1. **Decompose the system** — draw data flow diagram (DFD)
2. **Identify trust boundaries** — where does data cross permission zones?
3. **Enumerate threats** — apply STRIDE to each component
4. **Rate risk** — CVSS score or likelihood × impact matrix
5. **Define mitigations** — controls for each high/critical threat
6. **Validate mitigations** — confirm controls are implemented

---

## OWASP Top 10 — Quick Reference

### A01: Broken Access Control
```typescript
// ❌ Vulnerable — trusts user-supplied ID
app.get('/api/invoice/:id', async (req, res) => {
  const invoice = await db.invoice.findById(req.params.id);
  return res.json(invoice);
});

// ✅ Secure — enforces ownership
app.get('/api/invoice/:id', authenticate, async (req, res) => {
  const invoice = await db.invoice.findFirst({
    where: { id: req.params.id, userId: req.user.id } // IDOR prevention
  });
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  return res.json(invoice);
});
```

### A02: Cryptographic Failures
- Never store passwords in plaintext or with MD5/SHA1 — use bcrypt/argon2
- Encrypt PII at rest (AES-256-GCM)
- Use TLS 1.2+ everywhere; disable older protocols
- Rotate secrets regularly; never commit secrets to git

### A03: Injection
```typescript
// ❌ SQL Injection
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ Parameterized query
const user = await db.$queryRaw`SELECT * FROM users WHERE email = ${email}`;
```

### A04: Insecure Design
- Threat model before building, not after
- Apply principle of least privilege by default
- Design rate limiting into APIs from day one

### A05: Security Misconfiguration
- Disable default credentials on all services
- Remove debug endpoints in production
- Set security headers: `Content-Security-Policy`, `X-Frame-Options`, `HSTS`
- Disable directory listing on web servers

### A06: Vulnerable Components
- Run `npm audit` / `pip-audit` / `trivy` in CI
- Pin dependency versions; review before upgrading
- Subscribe to CVE feeds for critical dependencies

### A07: Authentication Failures
- Implement account lockout after N failed attempts
- Use multi-factor authentication for privileged accounts
- Session tokens: secure, httpOnly, sameSite cookies
- Invalidate sessions on logout and password change

### A08: Software and Data Integrity
- Verify integrity of third-party packages (lockfiles, checksums)
- Sign deployment artifacts
- Validate webhook signatures before processing

### A09: Logging Failures
```typescript
// Log security events — authentication, authorization, data access
logger.info({
  event: 'auth.login',
  userId: user.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  success: true,
  timestamp: new Date().toISOString()
});
// Never log: passwords, tokens, full PII, credit card numbers
```

### A10: Server-Side Request Forgery (SSRF)
```typescript
// ❌ Vulnerable — user controls URL
const data = await fetch(req.body.webhookUrl);

// ✅ Secure — validate URL against allowlist
const ALLOWED_HOSTS = new Set(['api.stripe.com', 'hooks.slack.com']);
const url = new URL(req.body.webhookUrl);
if (!ALLOWED_HOSTS.has(url.hostname)) throw new Error('Disallowed host');
```

---

## Secure SDLC Phases

| Phase | Security Activity |
|-------|------------------|
| Requirements | Security requirements, abuse cases |
| Design | Threat modeling, architecture review |
| Development | Secure coding standards, SAST in IDE |
| Testing | DAST, penetration testing, dependency scanning |
| Deployment | Secrets management, infra hardening |
| Operations | Continuous monitoring, vulnerability management |

---

## Incident Response

### Severity Levels
| Level | Definition | Response Time |
|-------|-----------|--------------|
| P0 Critical | Active breach, data exfiltration | Immediate |
| P1 High | Exploitable vuln in production | 4 hours |
| P2 Medium | Exploitable vuln, no current exploit | 72 hours |
| P3 Low | Minor misconfiguration | 2 weeks |

### Incident Runbook
1. **Detect** — alert fires or report received
2. **Contain** — isolate affected systems, revoke compromised credentials
3. **Investigate** — review logs, determine scope and blast radius
4. **Eradicate** — remove malicious code/access, patch vulnerability
5. **Recover** — restore systems, validate integrity
6. **Post-mortem** — root cause analysis, preventive controls

---

## Best Practices
- **Shift left**: Review security in PR, not after merge
- **Least privilege**: Default-deny for roles and permissions
- **Defense in depth**: Multiple layers of controls; no single point of failure
- **Zero trust**: Verify every request, even from internal services
- **Secrets hygiene**: Rotate secrets quarterly; use a secrets manager (Vault, AWS Secrets Manager)
- Never suppress security linter warnings without documented justification

---

## Collaboration Patterns

### With backend-engineer
- Pair on authentication and authorization implementation
- Review API designs for IDOR, injection, and mass assignment risks

### With devops-engineer
- Define infrastructure hardening baseline
- Implement secrets management in CI/CD

### With appsec
- appsec is the "embedded" version of this role — close partnership
- security-engineer sets standards; appsec implements per-team

---

## Tools
| Tool | Purpose |
|------|---------|
| Semgrep / Snyk | SAST — static code analysis |
| OWASP ZAP / Burp Suite | DAST — dynamic application testing |
| Trivy / Dependabot | SCA — dependency vulnerability scanning |
| GitLeaks / TruffleHog | Secrets scanning in git history |
| HashiCorp Vault | Secrets management |
| Falco | Runtime security monitoring |

---

## Anti-Patterns
- Security review only at the end of development
- Storing secrets in environment variables committed to git
- Rolling your own cryptography
- Trusting data from the client without server-side validation
- Ignoring security scanner output ("too many false positives")
- Security as a bottleneck team (should be embedded, not a gate)

---

## Checklist — Security Review
- [ ] Threat model completed for this feature
- [ ] OWASP Top 10 reviewed against implementation
- [ ] No secrets hardcoded; secrets manager in use
- [ ] Input validation present on all user-controlled data
- [ ] Authentication/authorization implemented correctly
- [ ] Security headers configured
- [ ] Dependency vulnerabilities scanned (no critical/high unaddressed)
- [ ] Audit logging implemented for security events

---

## Related Skills
- [appsec] — embedded security in dev teams
- [infrastructure-security] — network and infra hardening
- [security-testing] — penetration testing and validation
- [backend-engineer] — secure API implementation
