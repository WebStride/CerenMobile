---
name: containerization
description: Universal containerization skill covering Docker image design, multi-stage builds, Docker Compose for local development, Kubernetes basics, and container security. Apply when building, optimising, or debugging containerised services.
applyTo: ["**/Dockerfile*", "**/docker-compose*", "**/*.yaml", "**/*.yml", "**/.dockerignore"]
teamRole: DevOps
relatedSkills:
  - devops-engineer
  - deployment-strategies
  - monitoring
  - backend-engineer
expertise:
  - Docker
  - Kubernetes
  - Container security
  - Multi-stage builds
  - Local development environments
---

# Containerization Skill

## Role Overview
Containerization ensures applications run consistently across all environments — local, CI, staging, and production. This skill covers writing efficient, secure Dockerfiles, composing multi-service local environments, and running workloads on Kubernetes.

---

## Core Responsibilities

- Design lean, secure Docker images using multi-stage builds
- Write Docker Compose configurations for local development
- Define Kubernetes manifests for deployments, services, ingress
- Optimise image build times via layer caching strategy
- Enforce container security: non-root user, read-only filesystems, minimal base images
- Manage container registries (Docker Hub, ECR, GCR, GHCR)

---

## Dockerfile Best Practices

### Multi-Stage Build (Node.js)
```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production image (minimal)
FROM node:20-alpine AS runner
WORKDIR /app

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### Image Size Checklist
- [ ] Use Alpine or Distroless base images
- [ ] Multi-stage: build tools excluded from final image
- [ ] `.dockerignore` excludes `node_modules`, `.git`, `.env`, `coverage`
- [ ] No `apt-get` without `--no-install-recommends` + cache cleanup
- [ ] Final image < 200 MB (Node apps), < 50 MB (Go/Rust apps)

### .dockerignore
```
node_modules
.git
.env
.env.*
coverage
.next
*.log
README.md
```

---

## Docker Compose (Local Dev)

```yaml
# docker-compose.yml
version: '3.9'

services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
      target: development          # Use dev stage for hot-reload
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=development
    volumes:
      - ./apps/api/src:/app/src    # Hot-reload source code
    depends_on:
      db:
        condition: service_healthy  # Wait until DB is ready

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev -d myapp_dev"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Compose Tips
- Always use `healthcheck` + `depends_on: condition: service_healthy` — avoids race conditions
- Mount source code for development hot-reload, not for production
- Use `profiles` to separate dev-only tools (pgAdmin, Redis Commander)
- Override with `docker-compose.override.yml` for local customisation

---

## Container Security

### Non-Root User (Required)
```dockerfile
# Always run as non-root in production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

### Vulnerability Scanning
```bash
# Scan image before pushing
docker scout cves my-image:latest
# OR
trivy image my-image:latest
```

### Security Checklist
- [ ] Non-root user set (`USER appuser`)
- [ ] No sensitive data baked into image layers (use env vars at runtime)
- [ ] Read-only root filesystem where possible
- [ ] Minimal capabilities (`--cap-drop=ALL`)
- [ ] Image scanned for CVEs before registry push
- [ ] No SSH server in container
- [ ] Base image pinned to digest, not `latest`

---

## Kubernetes Basics

### Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels:
    app: api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myregistry/api:v1.2.3   # Always pin specific tag, never :latest
          ports:
            - containerPort: 3001
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
          resources:
            requests:
              cpu: "100m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /ready
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 10
```

### Kubernetes Checklist
- [ ] Resources `requests` and `limits` defined on all containers
- [ ] `livenessProbe` + `readinessProbe` configured
- [ ] Secrets via `secretKeyRef`, never plain `env.value`
- [ ] Image tag is specific (no `:latest`)
- [ ] `replicas: 2+` for production workloads
- [ ] `PodDisruptionBudget` for critical services

---

## Registry Management

```bash
# Tag and push to GitHub Container Registry
IMAGE=ghcr.io/myorg/myapp
docker build -t $IMAGE:$GIT_SHA .
docker tag $IMAGE:$GIT_SHA $IMAGE:latest
docker push $IMAGE:$GIT_SHA
docker push $IMAGE:latest

# Prune old images (run in CI weekly)
docker image prune --filter "until=720h" -f
```

---

## Anti-Patterns

- **`:latest` tag in prod** — non-deterministic, can auto-pull a breaking change
- **Secrets baked into image** — `ENV DATABASE_URL=postgres://...` visible in `docker inspect`
- **Running as root** — a container escape gives root on the host
- **One giant layer** — `COPY . . && RUN npm ci && RUN npm run build` invalidates cache on any file change
- **No `.dockerignore`** — `node_modules` (200 MB+) copied into build context, slowing every build
- **Fat dev image in prod** — dev tools, compilers, test runners left in production image

---

## Related Skills
- [devops-engineer] — CI/CD pipeline integration for container builds/pushes
- [deployment-strategies] — how containers are rolled out to environments
- [monitoring] — container metrics, log aggregation from pods
- [security-operations] — image scanning, runtime security policies
