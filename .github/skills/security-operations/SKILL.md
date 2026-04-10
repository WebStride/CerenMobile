---
name: security-operations
description: Universal security operations skill covering secret management, compliance, audit logging, SIEM, threat detection, and security incident response. Apply when hardening infrastructure, managing access controls, or responding to security events.
applyTo: ["**/*"]
teamRole: "DevOps"
relatedSkills:
  - security-engineer
  - appsec
  - infrastructure-security
  - devops-engineer
  - monitoring
expertise:
  - secret-management
  - access-control
  - audit-logging
  - SIEM
  - compliance
  - incident-response
---

# Security Operations Skill

## Role Overview
Security Operations (SecOps) bridges security engineering and IT operations. The goal is to continuously monitor, detect, and respond to threats while ensuring systems meet compliance requirements — without slowing down developer velocity.

---

## Core Responsibilities
- Manage secrets, credentials, and access keys lifecycle
- Implement and enforce RBAC (Role-Based Access Control)
- Maintain audit logs for all privileged actions
- Monitor systems for anomalies and threats (SIEM)
- Respond to security incidents
- Ensure compliance (SOC 2, GDPR, HIPAA, PCI-DSS as applicable)
- Conduct regular access reviews and privilege audits

---

## Secret Management

### Golden Rules
1. **Never** store secrets in code, `.env` files committed to git, or logs
2. Rotate secrets on a schedule — never wait for a breach
3. Use short-lived credentials (< 24 hours) wherever possible
4. Principle of Least Privilege — every service gets only what it needs

### Secret Management Tools
| Platform | Tool |
|----------|------|
| Any | HashiCorp Vault |
| AWS | AWS Secrets Manager, Parameter Store |
| GCP | Secret Manager |
| Azure | Azure Key Vault |
| Kubernetes | External Secrets Operator |
| CI/CD | GitHub Actions Secrets, GitLab CI Variables |

### Secret Rotation Checklist
- [ ] All DB passwords rotate every 90 days
- [ ] API keys rotate every 180 days or on-demand
- [ ] Service account keys rotate every 90 days
- [ ] Rotation is automated — no manual steps
- [ ] Rotation tested in staging before production

---

## Access Control (RBAC)

### Design Principles
- Least Privilege: grant minimum necessary access
- Separation of Duties: no single person can both approve and deploy
- Zero Trust: verify every request regardless of network location
- Time-boxed access: temporary elevated permissions for break-glass scenarios

### Access Review Cadence
| Access Type | Review Frequency |
|-------------|-----------------|
| Admin/Root access | Monthly |
| Production database access | Monthly |
| Cloud console access | Quarterly |
| Application user roles | Quarterly |
| Third-party integrations | Semi-annually |

---

## Audit Logging

### What Must Be Logged
- Authentication events (login, logout, MFA, failures)
- Authorization failures (access denied)
- Privileged actions (admin operations, config changes, deletions)
- Data export events
- Secret access events
- Infrastructure changes (Terraform applies, deployments)

### Audit Log Requirements
- **Tamper-proof**: logs must be immutable and stored separately from application
- **Retained**: minimum 1 year for most compliance frameworks
- **Structured**: JSON format with `who`, `what`, `when`, `from_where`, `result`
- **Searchable**: indexed and queryable within minutes

```json
{
  "timestamp": "2026-01-15T10:30:00Z",
  "event_type": "user.delete",
  "actor": { "id": "usr_admin", "email": "admin@company.com", "ip": "1.2.3.4" },
  "target": { "type": "user", "id": "usr_123" },
  "result": "success",
  "session_id": "sess_abc",
  "request_id": "req_xyz"
}
```

---

## Threat Detection & SIEM

### Key Signals to Monitor
- Multiple failed logins → brute force attempt
- Login from new country/device → account takeover
- Unusual data export volume → data exfiltration
- Privilege escalation events → insider threat
- Spike in API errors → scanning/probing
- Outbound connections to unknown IPs → C2 communication

### SIEM Tools
- **Cloud-native**: AWS Security Hub, GCP Security Command Center, Microsoft Sentinel
- **Self-hosted**: Elastic SIEM, Wazuh
- **SaaS**: Splunk, Sumo Logic, Datadog Security

### Alert Rules (Examples)
```
IF failed_logins > 10 in 5 minutes FROM same_ip → Block IP, alert
IF login FROM country NOT IN user_history → MFA challenge, alert
IF data_export > 10MB by single_user → Ticket + review
IF admin_login outside business_hours → Page security team
```

---

## Compliance Frameworks

### Common Requirements by Framework
| Requirement | SOC 2 | GDPR | HIPAA | PCI-DSS |
|-------------|-------|------|-------|---------|
| Audit logs | ✅ | ✅ | ✅ | ✅ |
| Encryption at rest | ✅ | ✅ | ✅ | ✅ |
| Encryption in transit | ✅ | ✅ | ✅ | ✅ |
| Access reviews | ✅ | ✅ | ✅ | ✅ |
| Incident response plan | ✅ | ✅ | ✅ | ✅ |
| Data retention policy | ✅ | ✅ | ✅ | ✅ |
| Right to deletion | ❌ | ✅ | ❌ | ❌ |
| Breach notification (72h) | ❌ | ✅ | ✅ | ❌ |

---

## Security Incident Response

### Incident Categories
| Category | Examples |
|----------|---------|
| Credential compromise | Leaked API key, stolen password |
| Unauthorized access | Attacker in prod system |
| Data breach | PII exfiltrated |
| Ransomware | Files encrypted |
| DDoS | Service unavailable |

### Response Steps
1. **Contain** — revoke credentials, block IPs, isolate affected systems
2. **Assess** — determine blast radius, what data/systems affected
3. **Eradicate** — remove attacker access, patch vulnerability
4. **Recover** — restore from clean backups, re-enable services
5. **Notify** — legal, customers as required by compliance
6. **Post-mortem** — document timeline, root cause, improvements

---

## Anti-Patterns
- Granting broad IAM permissions to avoid permission errors
- Storing secrets in environment variables in docker-compose committed to git
- Sharing service account credentials between services
- Never rotating long-lived API keys
- Audit logs stored in the same system they're auditing
- Security reviews only at release time — too late to fix

---

## Checklist — Security Operations Baseline
- [ ] All secrets in a secret manager (not in code/env files)
- [ ] Secret rotation automated
- [ ] RBAC implemented with least privilege
- [ ] Quarterly access reviews scheduled
- [ ] Audit logging for all privileged actions
- [ ] Audit logs stored immutably, retained 1+ year
- [ ] SIEM or alerting rules for key threat signals
- [ ] Security incident response plan documented
- [ ] Compliance requirements identified and tracked
- [ ] Penetration test scheduled annually

---

## Collaboration Patterns
- **Security Engineer** — threat modeling, vulnerability assessment
- **Infrastructure Security** — network security, encryption configuration
- **DevOps Engineer** — CI/CD security gates, infrastructure hardening
- **Backend Engineer** — audit log instrumentation, auth implementation
- **Tech Lead** — security architecture decisions
