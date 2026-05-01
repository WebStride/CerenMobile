---
name: devops-engineer
description: Universal DevOps engineering skill covering CI/CD pipelines, infrastructure as code, cloud provisioning, environment management, and developer experience. Works across AWS, GCP, Azure, Vercel, and any cloud platform. Query Context7 MCP for live provider-specific documentation before generating stack-specific configs.
applyTo: ["**/*.yml", "**/*.yaml", "**/*.tf", "**/Dockerfile", "**/.github/workflows/**", "**/docker-compose*"]
teamRole: DevOps
relatedSkills:
  - containerization
  - monitoring
  - security-operations
  - deployment-strategies
  - backend-engineer
expertise:
  - CI/CD pipelines
  - Infrastructure as Code
  - Cloud platforms
  - Environment management
  - Developer experience
---

# DevOps Engineer Skill

## Role Overview
DevOps engineers bridge development and operations — automating the path from code commit to production deployment, maintaining reliable infrastructure, and keeping developer velocity high. They own the build/test/deploy pipeline and treat infrastructure as versioned, testable code.

---

## Core Responsibilities

- Design and maintain CI/CD pipelines (GitHub Actions, GitLab CI, CircleCI, Jenkins)
- Provision and manage cloud infrastructure (IaC with Terraform, Pulumi, CDK)
- Define environment strategy: dev, staging, preview, production
- Manage secrets, credentials, and environment variables securely
- Monitor pipeline health, flaky tests, and deployment stability
- Enforce quality gates (lint, test, security scan) before merge
- Optimize build times and developer feedback loops
- Manage dependency updates and vulnerability patching automation

---

## CI/CD Pipeline Design

### Pipeline Stages (ordered)
```
1. Trigger (push, PR, tag, schedule)
2. Validate (lint, type-check, format)
3. Test (unit → integration → E2E)
4. Security scan (SAST, dependency audit)
5. Build (compile, bundle, Docker image)
6. Publish (registry push, artifact upload)
7. Deploy (environment-specific)
8. Verify (smoke tests, health checks)
9. Notify (Slack, GitHub status)
```

### GitHub Actions Best Practices
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci --prefer-offline
      - run: npm run lint
      - run: npm run type-check

  test:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci --prefer-offline
      - run: npm run test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci --prefer-offline
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next/
```

### Key Principles
- **Parallelise** — run independent jobs concurrently
- **Cache aggressively** — `node_modules`, Docker layers, build artifacts
- **Fail fast** — lint/type-check before running tests
- **Immutable artifacts** — build once, promote through environments
- **No secrets in logs** — always use `${{ secrets.NAME }}`

---

## Infrastructure as Code

### Terraform Patterns
```hcl
# Always pin provider versions
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

# Use variables, never hardcode
variable "environment" {
  type        = string
  description = "Deployment environment"
}

# Tag all resources
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "MyApp"
  }
}
```

### IaC Checklist
- [ ] State stored remotely with locking (S3+DynamoDB, Terraform Cloud)
- [ ] Modules used for reusable components
- [ ] Variables for all environment-specific values
- [ ] All resources tagged with environment + project
- [ ] `terraform plan` reviewed before `terraform apply`
- [ ] Sensitive outputs marked `sensitive = true`

---

## Environment Strategy

```
┌─────────────────────────────────────────────────────────────┐
│  local → PR preview → staging → production                  │
│                                                             │
│  local:    developer machine, local DB, mock services       │
│  preview:  per-PR ephemeral env, full stack, real DB clone  │
│  staging:  persistent, mirrors production, used for QA      │
│  prod:     live traffic, strict policies, on-call alerts    │
└─────────────────────────────────────────────────────────────┘
```

### Environment Variable Management
- Use `.env.example` committed to repo (no real values)
- Inject real values via CI secrets / vault
- Never commit `.env` files
- Use `dotenv-vault` or AWS Parameter Store / GCP Secret Manager

---

## Secrets Management

```yaml
# GitHub Actions — use environment secrets
- name: Deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    API_KEY: ${{ secrets.API_KEY }}
  run: npm run deploy

# Rotate secrets regularly
# Audit secret access logs monthly
# Use least-privilege service accounts
```

**Never:**
- Hardcode secrets in code or config files
- Log environment variables
- Use long-lived static credentials when OIDC is available

---

## Build Optimization

### Node.js/Next.js Build Caching
```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      ${{ github.workspace }}/.next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.ts','**/*.tsx') }}
    restore-keys: |
      ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-
      ${{ runner.os }}-nextjs-
```

### Docker Layer Caching
```dockerfile
# Put frequently-changing layers last
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./       # ← copies first (rarely changes)
RUN npm ci --production     # ← cached when package.json unchanged

FROM deps AS builder
COPY . .                    # ← copies code (changes often)
RUN npm run build
```

---

## Developer Experience (DX)

- **Fast feedback loops** — CI under 5 minutes for PR checks
- **Clear failure messages** — annotate PR with exact lint/test failures
- **One-command bootstrap** — `npm run dev:setup` provisions local environment
- **Preview deployments** — every PR gets a live URL for review
- **Dependency update automation** — Dependabot or Renovate PRs with changelog

---

## Quality Gates (Required Before Merge)

| Gate | Tool | Threshold |
|------|------|-----------|
| Lint | ESLint / Biome | 0 errors |
| Type check | TypeScript | 0 errors |
| Unit tests | Jest / Vitest | Pass + coverage threshold |
| Security scan | `npm audit` / Snyk | No high/critical |
| Build | Framework build | Must succeed |
| E2E (optional) | Playwright | Pass on staging |

---

## Collaboration Patterns

- **With Backend Engineer** — set up local Docker Compose for services, define env vars required
- **With Frontend Engineer** — manage `NEXT_PUBLIC_*` env vars, preview deployment config
- **With Security Operations** — rotate secrets, audit IAM policies, SAST integration
- **With QA** — provision staging, enable E2E pipelines, manage test data
- **With Tech Lead** — propose infra architecture, cost review, scaling plan
- **With Monitoring** — set up alerting thresholds, on-call runbooks

---

## Anti-Patterns

- **Snowflake servers** — servers configured manually, not reproducibly via IaC
- **Secrets in environment** — checking `.env` files into version control
- **Long-lived feature branches** — stale branches accumulate merge conflicts + drift
- **No rollback plan** — deploying without ability to instantly revert
- **Build on merge to main only** — no PR checks means broken code lands
- **Flaky tests ignored** — flaky tests disable trust in the pipeline entirely
- **No staging environment** — testing directly in production
- **Manual deploys** — `ssh` + `git pull` in production

---

## Pre-Deploy Checklist

- [ ] All CI checks green (lint, test, build, security)
- [ ] Migrations reviewed and reversible (or forward-only with plan)
- [ ] Environment variables set in target environment
- [ ] Feature flags configured if needed
- [ ] Rollback procedure documented
- [ ] Monitoring/alerting confirms baseline before deploy
- [ ] On-call engineer notified for major releases
- [ ] Smoke tests pass post-deploy

---

## Related Skills
- [containerization] — Docker/Kubernetes infrastructure management
- [monitoring] — observability, alerting, incident response
- [security-operations] — secrets, compliance, audit logging
- [deployment-strategies] — blue-green, canary, rollback patterns
- [backend-engineer] — API deployment, database migrations
