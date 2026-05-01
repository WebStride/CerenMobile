---
name: security-scan
description: 'Security scanning workflow before every release. Covers dependency vulnerability scanning (npm audit), secret detection, OWASP Top 10 checklist, Prisma schema security review, and API endpoint hardening. Use before every EAS build submission, production deployment, or major PR merge.'
argument-hint: 'What are you scanning? (mobile, backend, full release, PR review)'
origin: ECC
---

# Security Scan — Pre-Release Security Checklist

**Applies to:** Every release, every major feature PR, and any change touching auth, payments, or user data.  
**Trigger:** Before EAS build submission, before deploying backend to EC2, before merging security-sensitive PRs.

> "Security is not a feature. It's the foundation everything else stands on."

---

## When to Activate

- Before any EAS production or preview build
- Before deploying backend changes to EC2
- When adding new API endpoints or authentication flows
- When changing Prisma schema (especially adding sensitive fields)
- When reviewing any PR that touches auth, user data, or payments
- Monthly routine security audit

---

## Phase 1 — Dependency Vulnerability Scan

```bash
# Scan backend dependencies
cd backend && npm audit --audit-level=moderate

# Scan mobile dependencies
cd MobileAppUI && npm audit --audit-level=moderate

# Auto-fix safe updates (review manually)
npm audit fix

# For breaking changes — review each manually, never blindly apply
npm audit fix --force  # Only if you understand each change
```

**Acceptable levels:**
- Info/Low: Monitor, fix in next sprint
- Moderate: Fix before next production release
- High/Critical: Fix before merging to main

---

## Phase 2 — Secret Detection

```bash
# Scan for accidentally committed secrets
# Install git-secrets or trufflesecurity/trufflehog if not present
brew install trufflehog

# Scan git history for secrets
trufflehog git file://. --only-verified

# Manually check .env files are gitignored
cat .gitignore | grep -E "\.env"

# Verify no secrets in staged files
git diff --cached | grep -iE "(password|secret|key|token|api_key)" | grep -v "example\|sample\|test\|TODO"
```

**Files that must NEVER be committed:**
```
backend/.env
backend/.env.*
MobileAppUI/.env
MobileAppUI/.env.*
MobileAppUI/google-services.json (contains API keys)
*.pem *.key *.p12 *.pfx
```

---

## Phase 3 — OWASP Top 10 Checklist

Work through each item against the current codebase:

### A01: Broken Access Control
```
□ Every API endpoint has authentication middleware
□ Users can only access their own data (customer ID validation)
□ Admin endpoints are protected by role checks
□ No IDOR (Insecure Direct Object References) — check IDs are validated against user
```

**CerenMobile-specific checks:**
```typescript
// ✅ Always validate that the order/invoice belongs to the requesting customer
const order = await prisma.order.findFirst({
  where: {
    id: orderId,
    customerId: req.user.customerId, // NOT just orderId alone
  },
});
```

### A02: Cryptographic Failures
```
□ Passwords are never stored in plaintext (OTP-based, no passwords)
□ Tokens use strong secrets (ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET)
□ Token secrets are at least 256 bits (32+ chars)
□ HTTPS enforced in production (Nginx config)
□ Sensitive data (tokens) stored in SecureStore, not AsyncStorage
```

### A03: Injection
```
□ All database queries use Prisma (parameterized) — no raw SQL with user input
□ Input validation on all API endpoints
□ No eval() or dynamic code execution
□ Mobile: no deep link URLs passed directly to navigation without validation
```

### A04: Insecure Design
```
□ OTP bypass ONLY enabled when NODE_ENV=development
□ Rate limiting on OTP send endpoint (prevent SMS bombing)
□ Refresh token rotation implemented
□ No sensitive data in URL query params (use POST body)
```

### A05: Security Misconfiguration
```
□ CORS configured to specific allowed origins (not *)
□ Security headers set (helmet.js on Express)
□ Error messages don't expose stack traces in production
□ .env files not in version control
□ Default credentials changed
```

### A06: Vulnerable and Outdated Components
```
□ npm audit passes with no high/critical vulnerabilities
□ Node.js version is LTS and supported
□ Dependencies updated within past 90 days
```

### A07: Identification and Authentication Failures
```
□ JWT tokens expire (ACCESS_TOKEN: 15min, REFRESH_TOKEN: 7 days)
□ Refresh tokens invalidated on logout
□ OTP has expiry time (5 minutes)
□ No session fixation vulnerabilities
```

### A08: Software and Data Integrity Failures
```
□ Dependencies have integrity hashes (package-lock.json committed)
□ No untrusted CDN dependencies
```

### A09: Security Logging and Monitoring
```
□ Failed auth attempts are logged
□ Suspicious activity (too many OTP requests) triggers alerts
□ Logs don't contain sensitive data (passwords, full tokens)
```

### A10: Server-Side Request Forgery (SSRF)
```
□ If app fetches external URLs, whitelist is enforced
□ Google Maps API key restricted to specific app bundle IDs
□ MSG91 API key restricted to specific IP ranges
```

---

## Phase 4 — Express/Node.js Hardening Check

```typescript
// ✅ Required middleware in backend/src/app.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// Security headers
app.use(helmet());

// CORS — specific origins only
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
}));

// Rate limiting on OTP endpoint
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Max 5 OTP requests per window
  message: 'Too many OTP requests, please try again later.',
});
app.use('/api/auth/send-otp', otpLimiter);
```

---

## Phase 5 — Mobile Security Check

```
□ Tokens stored in expo-secure-store (NOT AsyncStorage)
□ API base URL from environment (not hardcoded)
□ Google Maps API key not visible in source code
□ Deep link handling validates URLs before navigation
□ No sensitive data in React Navigation params (use context/state)
□ Certificate pinning considered for production (advanced)
```

---

## Phase 6 — Prisma Schema Security Review

```prisma
// Check all models that handle sensitive data:
// □ No plaintext password fields
// □ Sensitive fields are typed correctly (not generic String)
// □ Relations have proper cascade behavior (no unintended data exposure)
// □ No fields that should be server-only exposed in client queries
```

---

## Reporting

After scanning, create a brief security report:
```markdown
## Security Scan — [Date]

### Dependency Vulnerabilities
- backend: X high, Y moderate, Z low
- mobile: X high, Y moderate, Z low
- Action taken: ...

### OWASP Checklist
- Passed: A01, A02, A03, A04, A05, A06, A07, A08, A09, A10
- Findings: [list any issues]
- Remediated: [list fixes applied]

### Next Scan Due: [Date + 30 days]
```

---

## Verification Checklist

- [ ] `npm audit` run on both backend and mobile — no high/critical
- [ ] No secrets found in git history or staged files
- [ ] OWASP Top 10 checklist reviewed
- [ ] OTP bypass disabled in production environment
- [ ] Security headers (helmet) configured in Express
- [ ] Rate limiting on auth endpoints
- [ ] All tokens stored in SecureStore on mobile
- [ ] CORS configured to specific allowed origins
