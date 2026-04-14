---
name: monorepo-patterns
description: Universal monorepo engineering skill covering workspace management, shared package design, build caching, dependency constraints, and CI/CD strategies for Turborepo, Nx, and similar tools.
applyTo: ["**/turbo.json", "**/nx.json", "**/package.json", "**/workspace.json", "**/.npmrc"]
teamRole: Engineering
relatedSkills:
  - frontend-engineer
  - backend-engineer
  - devops-engineer
  - fullstack-engineer
expertise:
  - workspace-management
  - shared-packages
  - build-caching
  - dependency-constraints
  - code-sharing
  - ci-optimization
---

# Monorepo Patterns Skill

## Role Overview
The monorepo engineer designs and maintains the workspace structure that allows multiple apps and packages to coexist, share code, and deploy independently. Responsible for build system configuration, dependency graph management, shared library design, and ensuring CI pipelines scale efficiently with the codebase.

---

## Core Responsibilities
- Design the workspace directory structure (apps vs packages)
- Configure build orchestration (Turborepo, Nx, Bazel, Lerna)
- Design and publish shared internal packages (UI, utils, types, db client)
- Enforce dependency constraints (packages can't depend on apps)
- Optimize build caching for fast CI/CD
- Manage versioning strategy for internal packages
- Coordinate breaking changes across workspace consumers
- Keep workspace dependency graph clean (no circular dependencies)

---

## Workflows

### New Shared Package Workflow
1. Identify code used in 2+ apps — that's a package candidate
2. Create `packages/<name>/` with its own `package.json` and `tsconfig.json`
3. Set `"name": "@repo/<name>"` for workspace-scoped import
4. Define explicit `exports` in `package.json` (named entry points)
5. Add the package to consuming apps via workspace protocol (`"@repo/<name>": "*"`)
6. Wire into build pipeline (add to `turbo.json` `pipeline`)
7. Write README for the package (purpose, API, usage)

### New App Workflow
1. Scaffold app under `apps/<name>/`
2. Reference shared packages via workspace protocol
3. Add app-specific `turbo.json` or `nx.json` targets
4. Ensure independent CI/CD pipeline can build + test the app in isolation

### Breaking Change in Shared Package
1. Check `turbo run build --filter="...[<package>]..."` to find all affected consumers
2. Update all consumers in the same PR (atomic change)
3. If needed, version the package and support both versions temporarily
4. Add a migration guide in the package CHANGELOG

---

## Best Practices

### Workspace Structure
```
monorepo/
  apps/
    web/          # Next.js frontend
    api/          # Node.js backend
    mobile/       # React Native
  packages/
    ui/           # Shared component library
    db/           # Database client + schema
    utils/        # Shared utilities
    types/        # Shared TypeScript types
    config/       # Shared ESLint, TSConfig, Prettier configs
    validations/  # Shared Zod schemas
```

### Package Design Rules
- Packages are **consumed by apps**, not by other packages unless truly shared
- No circular dependencies — enforce with ESLint `import/no-cycle`
- Every package exports a clean public API via `package.json` `exports` field
- Packages should not import from apps (uni-directional dependency flow)
- Keep package scope tight — one purpose per package

### Build Caching
- Enable remote caching (Turborepo Cloud, Nx Cloud) for team-wide cache sharing
- Define exact `inputs` and `outputs` in pipeline tasks for accurate cache keys
- Never include build artifacts in source control
- Use `--filter` flag in CI to only build/test affected packages

### Dependency Management
- Use consistent Node/package manager versions across workspace (enforce via `.nvmrc`, `packageManager` field)
- Hoist shared dependencies to workspace root to deduplicate
- Use `peerDependencies` carefully in packages to avoid version conflicts
- Periodically run `npm dedupe` or `pnpm dedupe`

### Turborepo Configuration Example
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "test/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## Collaboration Patterns

### With frontend-engineer / backend-engineer
- Communicate before extracting shared code — ensure package API is agreed upon
- Package authors are responsible for documenting breaking changes

### With devops-engineer
- Remote caching setup requires CI environment tokens (Turborepo/Nx Cloud)
- CI pipelines should use `--filter` to only run affected tasks

### With fullstack-engineer
- Full-stack features often require coordinated changes across app + shared packages
- Plan the package API before implementing either end

---

## Tools & Technologies
| Tool | Purpose |
|------|---------|
| Turborepo | Build orchestration, task caching |
| Nx | Build orchestration, advanced dependency graph |
| pnpm workspaces | Fast, efficient package management |
| npm workspaces / yarn workspaces | Alternative workspace managers |
| Changesets | Version management + changelogs |
| ESLint `import/no-cycle` | Circular dependency detection |
| `turbo-ignore` | Skip unchanged apps in CD |

---

## Anti-Patterns
- One massive `packages/shared` with everything — creates tight coupling
- Circular dependencies between packages — breaks build graph
- Publishing internal packages to npm — use workspace protocol instead
- Inconsistent `tsconfig.json` setups across packages — causes type errors
- Putting app-specific code in shared packages
- Not using `--filter` in CI — rebuilding everything on every commit
- Missing `exports` in `package.json` — exposes internal internals

---

## Checklist
- [ ] Package structure follows apps/ vs packages/ convention
- [ ] All shared packages use `@repo/<name>` naming
- [ ] No circular dependencies (run `madge --circular`)
- [ ] `package.json` `exports` field defined on all packages
- [ ] `turbo.json` / `nx.json` pipeline configured with correct inputs/outputs
- [ ] Remote caching enabled (Turborepo Cloud or Nx Cloud)
- [ ] CI uses `--filter` to only build affected packages
- [ ] Breaking changes documented in CHANGELOG
- [ ] Workspace Node/package manager version locked

---

## Related Skills
- [frontend-engineer] — consumes shared UI, types, utils packages
- [backend-engineer] — consumes shared db, types, utils packages
- [devops-engineer] — CI/CD pipeline integration with build caching
- [fullstack-engineer] — coordinates changes across multiple workspace layers
