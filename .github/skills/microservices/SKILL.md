---
name: microservices
description: Universal microservices engineering skill covering service decomposition, inter-service communication, resilience patterns, distributed tracing, and API gateway design. Framework and language agnostic.
applyTo: ["**/*.ts", "**/*.js", "**/*.go", "**/*.py", "**/*.java", "**/*.yaml", "**/*.yml"]
teamRole: Engineering
relatedSkills:
  - backend-engineer
  - api-design
  - devops-engineer
  - monitoring
  - containerization
expertise:
  - service-decomposition
  - inter-service-communication
  - resilience-patterns
  - distributed-tracing
  - api-gateway
  - event-driven-architecture
  - data-consistency
---

# Microservices Skill

## Role Overview
The microservices engineer designs and builds distributed systems composed of independently deployable services. Responsible for service decomposition, defining communication contracts, implementing resilience patterns, and ensuring the system behaves correctly under partial failures.

---

## Core Responsibilities
- Decompose monoliths or domain models into appropriate service boundaries
- Define and maintain service communication contracts (REST, gRPC, events)
- Implement resilience patterns (circuit breakers, retries, fallbacks)
- Design event-driven flows for async inter-service communication
- Ensure data consistency across service boundaries (Saga, Outbox)
- Coordinate with DevOps for independent deployment pipelines
- Define service SLIs/SLOs and error budgets
- Implement distributed tracing and correlation IDs

---

## Workflows

### Service Decomposition Workflow
1. Map business domains using Domain-Driven Design (bounded contexts)
2. Identify seams — places where coupling is low and cohesion is high
3. Define service interfaces before writing any code
4. Start with a strangler fig pattern when breaking a monolith
5. Move one domain at a time — validate before proceeding

### New Service Creation Workflow
1. Define the service contract (API spec or event schema) first
2. Set up independent repository/package with CI/CD pipeline
3. Implement the happy path, then add resilience (retries, circuit breaker)
4. Add health check endpoints (`/health`, `/ready`)
5. Wire up distributed tracing (propagate trace/span IDs)
6. Document in service catalog / API registry

### Incident Response Workflow
1. Check distributed trace to identify the failing service
2. Review circuit breaker state — is a downstream service causing cascading failures?
3. Check the dead-letter queue for unprocessed events
4. Roll back the problematic service independently (one benefit of microservices)

---

## Best Practices

### Service Design
- Each service owns its data — no shared databases between services
- Services communicate via well-defined contracts, never by direct DB access
- Design for failure: assume any downstream call can fail
- Keep services small but not too small — match service boundaries to domain boundaries
- Prefer async (event-driven) communication for write operations; sync (REST/gRPC) for reads

### Communication
- Use async messaging (Kafka, RabbitMQ, SQS) for cross-service writes
- Use REST/gRPC for synchronous reads where latency matters
- Define and version API contracts explicitly (OpenAPI, Protobuf, AsyncAPI)
- Never break existing contracts — version them instead

### Resilience Patterns
| Pattern | When to Use |
|---------|-------------|
| Retry with backoff | Transient network failures |
| Circuit Breaker | Protect against downstream failures |
| Bulkhead | Isolate critical paths from non-critical |
| Timeout | Prevent slow dependencies from blocking |
| Fallback | Graceful degradation when service unavailable |
| Saga | Distributed transactions across services |
| Outbox Pattern | Ensure events are published exactly once |

### Data Consistency
- Use the Outbox Pattern to guarantee event delivery after a DB write
- Use Saga (choreography or orchestration) for multi-step transactions
- Accept eventual consistency — design UX to handle it gracefully
- Never use distributed transactions (2PC) — too slow and fragile

### Observability
- Propagate correlation IDs (`X-Request-ID`, `traceparent`) on every request
- Emit structured logs with service name, trace ID, and span ID
- Add `duration_ms` to all external call logs
- Set SLOs per service and alert on error budget burn rate

---

## Collaboration Patterns

### With backend-engineer
- Each service owner is a backend engineer responsible for their service's full lifecycle
- Code review focuses on service contract stability and resilience patterns

### With devops-engineer
- Every service needs its own CI/CD pipeline — coordinate pipeline templates
- Container orchestration (K8s) manages service discovery and scaling

### With api-design
- API contracts must be designed before implementation begins
- Breaking changes require versioning, deprecation notices, and migration guides

### With monitoring
- Distributed tracing (Jaeger, Zipkin, Tempo) is mandatory — not optional
- Define per-service SLOs and dashboards

---

## Tools & Technologies
| Tool | Purpose |
|------|---------|
| Kafka / RabbitMQ / SQS | Async event streaming |
| gRPC / REST | Synchronous communication |
| Istio / Linkerd | Service mesh, traffic management |
| Jaeger / Zipkin / Tempo | Distributed tracing |
| OpenAPI / AsyncAPI / Protobuf | Contract definition |
| Kubernetes | Orchestration and service discovery |
| Consul / etcd | Service registry |
| Resilience4j / Polly / Hystrix | Circuit breaker libraries |

---

## Anti-Patterns
- Shared database between services — tightly couples services
- Synchronous chains of 5+ services — amplifies latency and failure probability
- Missing circuit breakers — cascading failures take down the whole system
- Fat services that own too many domains — defeats the purpose
- Nano-services that only wrap one function — unnecessary network overhead
- No distributed tracing — debugging is impossible without it
- Breaking API contracts without versioning
- Deploying all services together — defeats independent deployability

---

## Checklist
- [ ] Service boundaries align with business domain (bounded context)
- [ ] Each service has its own database/schema — no sharing
- [ ] Communication contracts defined (OpenAPI/Protobuf/AsyncAPI)
- [ ] Resilience patterns implemented (retry, circuit breaker, timeout)
- [ ] Health check endpoints in place (`/health`, `/ready`)
- [ ] Distributed tracing propagated (trace ID + span ID in all logs)
- [ ] Outbox pattern for any event-producing writes
- [ ] Independent CI/CD pipeline per service
- [ ] SLOs defined per service
- [ ] Runbook for common failure modes documented

---

## Related Skills
- [backend-engineer] — each microservice is built by a backend engineer
- [api-design] — contracts must be defined before code
- [devops-engineer] — deployment, orchestration, service mesh
- [monitoring] — distributed tracing, per-service SLOs
- [containerization] — each service runs as an independent container
