---
name: infrastructure-security
description: Universal infrastructure security skill covering network security, cloud hardening, access control, encryption, secrets management, and compliance. Apply when securing cloud infrastructure, reviewing IAM policies, hardening Kubernetes clusters, or implementing zero-trust architecture.
applyTo: ["**/*.tf", "**/*.yaml", "**/*.yml", "**/Dockerfile", "**/*.json", "**/.env*"]
teamRole: Security
relatedSkills:
  - security-engineer
  - appsec
  - devops-engineer
  - containerization
  - security-operations
  - monitoring
expertise:
  - Network security and segmentation
  - Cloud IAM and access control
  - Secrets management
  - Encryption at rest and in transit
  - Compliance frameworks
  - Zero-trust architecture
---

# Infrastructure Security Skill

## Role Overview
Infrastructure Security engineers protect the underlying systems, networks, and cloud environments that applications run on. You define security baselines, enforce least-privilege access, manage secrets, and ensure the infrastructure is resilient against external and internal threats.

## Core Responsibilities
- Design and enforce network security policies (firewalls, VPCs, segmentation)
- Implement and audit IAM roles, policies, and service accounts
- Manage secrets and credentials securely (rotation, vaulting, no hardcoding)
- Harden cloud environments (AWS, GCP, Azure) against misconfigurations
- Implement encryption for data at rest and in transit
- Ensure compliance with SOC 2, ISO 27001, GDPR, PCI-DSS as applicable
- Perform infrastructure security assessments and penetration tests
- Monitor for anomalous activity and unauthorized access

## Network Security

### VPC / Network Segmentation
```
- Isolate environments: production, staging, development in separate VPCs/networks
- Use private subnets for databases and internal services
- Allow only necessary ingress/egress via security groups / firewall rules
- Enable VPC Flow Logs for network traffic visibility
- Use NAT gateways — never expose internal services directly to the internet
```

### Firewall Rules Principles
```
- Default deny all inbound; allow only explicitly needed ports/protocols
- Restrict outbound traffic for sensitive workloads
- Separate rules per service tier (web, app, database)
- Document every rule with a reason — delete undocumented rules
- Review rules quarterly; remove stale exceptions
```

### Zero-Trust Architecture
```
- Never trust based on network location alone
- Authenticate and authorize every request regardless of origin
- Use short-lived credentials and tokens (not long-lived API keys)
- Enforce mutual TLS (mTLS) between internal services
- Implement service mesh (Istio, Linkerd) for microservice auth
```

## Cloud IAM & Access Control

### Least Privilege Principles
```
- Grant only the minimum permissions required for each service/user
- Avoid wildcard permissions (e.g., s3:* or resource: *)
- Use role-based access — no shared accounts or credentials
- Separate roles for humans vs. service accounts
- Audit permissions monthly and remove unused access
```

### IAM Best Practices
```yaml
# Bad — overly permissive
permissions:
  - "*"

# Good — scoped minimum permissions
permissions:
  - "s3:GetObject"
  - "s3:PutObject"
resources:
  - "arn:aws:s3:::my-bucket/*"
```

### Service Account Hygiene
```
- One service account per service — no sharing
- Disable unused service accounts immediately
- Rotate service account keys regularly (or use Workload Identity)
- Never download or store service account key files in repos
- Use managed identity / Workload Identity Federation where available
```

## Secrets Management

### Core Rules (Never Violate)
```
❌ Never hardcode secrets in code, configs, or Dockerfiles
❌ Never commit .env files or plaintext credentials to git
❌ Never log secrets — sanitize all logging pipelines
❌ Never pass secrets as environment variable values in CI logs
✅ Use a secrets manager: Vault, AWS Secrets Manager, GCP Secret Manager
✅ Rotate secrets automatically on a schedule
✅ Use short-lived tokens (1h or less) for sensitive operations
✅ Audit all secret access — log who accessed what and when
```

### Secrets in CI/CD
```yaml
# GitHub Actions — correct pattern
- name: Deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}   # Masked in logs
  run: deploy.sh

# Never do this:
# run: API_KEY=abc123 deploy.sh      # Exposed in logs
```

### Secret Rotation Checklist
- [ ] Identify all secrets and their owners
- [ ] Set rotation schedule (API keys: 90 days, DB passwords: 30 days, JWT secrets: 180 days)
- [ ] Automate rotation via secrets manager + Lambda/Cloud Function
- [ ] Test rotation in staging before production
- [ ] Alert on rotation failures immediately

## Encryption

### At Rest
```
- Enable encryption for all storage: S3, RDS, EBS, GCS, Azure Blob
- Use platform-managed keys (KMS) as minimum; customer-managed keys for sensitive data
- Encrypt database backups with the same or stronger key policy
- Never store plaintext PII, financial data, or health data
```

### In Transit
```
- Enforce TLS 1.2+ everywhere — disable TLS 1.0/1.1
- Use HTTPS-only for all public endpoints (HSTS)
- Implement certificate management and auto-renewal (cert-manager, Let's Encrypt)
- Use mTLS for service-to-service communication in sensitive environments
- Validate certificates — never disable SSL verification in production code
```

## Container & Kubernetes Security

### Docker Hardening
```dockerfile
# Use non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Use minimal base images
FROM node:20-alpine   # Not FROM node:20

# No secrets in image layers
# BAD:  ENV API_KEY=secret
# GOOD: Pass at runtime via secrets or env injection
```

### Kubernetes Security
```yaml
# SecurityContext — enforce in all pods
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]

# NetworkPolicy — deny all by default
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

### Container Image Security
```
- Scan images in CI with Trivy, Snyk, or Grype before pushing
- Use distroless or minimal base images
- Pin image versions — never use :latest in production
- Sign images with Cosign / Notary for supply chain verification
- Store images in private registries with access controls
```

## Compliance & Hardening Benchmarks

### CIS Benchmarks
Apply CIS benchmarks for:
- CIS AWS Foundations Benchmark
- CIS Kubernetes Benchmark
- CIS Docker Benchmark
- CIS Linux Benchmark (for EC2/VM)

### Infrastructure as Code Security
```
- Scan Terraform/CloudFormation with tfsec, Checkov, or Terrascan
- Use OPA/Rego policies to enforce security rules at plan time
- Run security checks in CI before `terraform apply`
- Store Terraform state in encrypted backends with access logging
```

### Compliance Checklist (SOC 2 / ISO 27001)
- [ ] Asset inventory up to date
- [ ] Access reviews completed quarterly
- [ ] Encryption at rest enabled for all storage
- [ ] Audit logging enabled and retained for 12+ months
- [ ] Incident response plan documented and tested
- [ ] Security training completed by all staff
- [ ] Vulnerability scanning automated and tracked
- [ ] Change management process enforced

## Monitoring & Incident Response

### What to Monitor
```
- Authentication failures and anomalous login patterns
- Privilege escalation attempts
- Unusual network traffic (large outbound transfers, new destinations)
- Secret access logs (who accessed what, when)
- Infrastructure changes outside approved processes
- Failed health checks indicating possible DDoS or attack
```

### Incident Response Steps
```
1. Detect: Alert fires (SIEM, CloudTrail, anomaly detection)
2. Contain: Revoke compromised credentials, isolate affected systems
3. Investigate: Audit logs, determine scope and root cause
4. Eradicate: Remove malware, patch vulnerability, rotate secrets
5. Recover: Restore from clean backup, verify integrity
6. Learn: Post-incident review, update runbooks, improve detection
```

## Pre-Deployment Security Checklist
- [ ] No secrets in code, configs, or container images
- [ ] Least-privilege IAM roles verified
- [ ] Network access restricted to minimum required ports
- [ ] TLS enabled and certificate valid
- [ ] Container runs as non-root
- [ ] Image scanned for critical vulnerabilities (none unpatched)
- [ ] Audit logging enabled
- [ ] Secrets manager configured (no hardcoded credentials)
- [ ] Backup and recovery plan tested

## Collaboration Patterns
- **devops-engineer**: Joint ownership of CI/CD pipeline security gates
- **security-engineer**: Threat model review for new infrastructure components
- **appsec**: Shared ownership of secrets management and auth flows
- **monitoring**: Co-design security alerting and audit log retention
- **containerization**: Container hardening and Kubernetes RBAC policies

## Anti-Patterns
```
❌ Using root/admin service accounts for applications
❌ Long-lived static credentials (API keys, passwords never rotated)
❌ Overly broad security groups (0.0.0.0/0 on sensitive ports)
❌ Secrets in environment variables passed as plaintext in CI logs
❌ Skipping encryption because "it's internal traffic"
❌ Manual infrastructure changes outside IaC — creates drift and audit gaps
❌ Disabling SSL verification for "ease of development" and forgetting to re-enable
❌ Sharing service accounts across multiple services
```
