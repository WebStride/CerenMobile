---
name: frontend-performance
description: Universal frontend performance skill covering Core Web Vitals, bundle optimization, lazy loading, caching strategies, and rendering patterns. Works across any modern frontend framework.
applyTo: ["**/*.tsx", "**/*.jsx", "**/*.ts", "**/*.js", "**/*.vue"]
teamRole: Engineering
relatedSkills:
  - frontend-engineer
  - devops-engineer
  - monitoring
expertise:
  - core-web-vitals
  - bundle-optimization
  - lazy-loading
  - caching
  - rendering-patterns
  - image-optimization
  - network-performance
---

# Frontend Performance Skill

## Role Overview
The frontend performance engineer identifies and eliminates bottlenecks in the user-facing layer. Responsible for Core Web Vitals scores, bundle size management, rendering strategy decisions, and ensuring fast, smooth experiences across devices and network conditions.

---

## Core Responsibilities
- Monitor and improve Core Web Vitals (LCP, CLS, INP/FID, TTFB)
- Analyze and reduce JavaScript bundle sizes
- Implement code splitting and lazy loading strategies
- Optimize images, fonts, and static assets
- Choose appropriate rendering strategies (SSR, SSG, ISR, CSR)
- Profile and eliminate render bottlenecks
- Implement effective caching strategies
- Audit third-party script impact
- Set and enforce performance budgets

---

## Workflows

### Performance Audit Workflow
1. Run Lighthouse / WebPageTest / Chrome DevTools Performance tab
2. Identify top bottlenecks by category (JS, CSS, images, fonts, network)
3. Profile with React DevTools Profiler or Vue DevTools
4. Measure bundle with `webpack-bundle-analyzer` or `vite-bundle-visualizer`
5. Fix highest-impact issues first (80/20 rule)
6. Re-measure and confirm improvement before moving on

### Bundle Optimization Workflow
1. Audit current bundle with analyzer tool
2. Identify heavy dependencies — find lighter alternatives
3. Apply tree-shaking, dynamic imports, route-based code splitting
4. Move heavy libraries to lazy load boundaries
5. Verify no duplication of shared packages across chunks

### Image Optimization Workflow
1. Audit all images for format (prefer WebP/AVIF over PNG/JPG)
2. Implement responsive images (`srcset`, `sizes`)
3. Add lazy loading for below-fold images
4. Use CDN with automatic transformations (Cloudinary, Imgix, Next.js Image)
5. Set explicit `width`/`height` to prevent CLS

---

## Best Practices

### JavaScript
- Favor dynamic `import()` over static imports for non-critical paths
- Use `React.lazy()` + `Suspense` for route and component splitting
- Memoize expensive computations with `useMemo`, `useCallback`
- Avoid unnecessary re-renders — profile with React DevTools before optimizing
- Remove unused code aggressively; audit polyfill bundles
- Prefer smaller, focused libraries over monolithic ones

### CSS & Fonts
- Use `font-display: swap` or `font-display: optional` for web fonts
- Preload critical fonts with `<link rel="preload">`
- Purge unused CSS (PurgeCSS, Tailwind's content config)
- Avoid layout-triggering CSS properties in animations (prefer `transform`, `opacity`)

### Images & Media
- Always serve images via CDN with format negotiation
- Use `loading="lazy"` for below-fold images
- Set explicit dimensions to prevent CLS
- Use blur placeholders for perceived performance

### Network
- Preconnect/prefetch critical third-party origins
- Enable HTTP/2 and compression (Brotli > gzip)
- Implement effective cache headers (immutable for hashed assets)
- Use resource hints: `<link rel="preload">`, `<link rel="prefetch">`

### Rendering Strategy Selection
| Scenario | Strategy |
|----------|----------|
| Marketing/landing pages | SSG |
| Frequently updated content | ISR |
| Personalized/user-specific | SSR or CSR with skeleton |
| Real-time data | CSR |
| SEO-critical dynamic data | SSR |

---

## Collaboration Patterns

### With frontend-engineer
- Set performance budgets before features are built, not after
- Review component designs for render cost before implementation

### With devops-engineer
- Coordinate CDN configuration, cache-control headers
- Set up performance monitoring in CI (Lighthouse CI)

### With monitoring
- Define performance SLOs (e.g., LCP < 2.5s at p75)
- Alert on regressions, not just absolute scores

### With ux-design
- Perceived performance is as important as measured performance
- Loading skeletons, optimistic updates, and transitions affect user perception

---

## Tools & Technologies
| Tool | Purpose |
|------|---------|
| Lighthouse / PageSpeed Insights | Audit Core Web Vitals |
| Chrome DevTools Performance | Profile runtime behavior |
| webpack-bundle-analyzer / vite-bundle-visualizer | Bundle audit |
| React DevTools Profiler | Component render profiling |
| WebPageTest | Real-browser waterfall analysis |
| Lighthouse CI | Performance gates in CI/CD |
| Next.js `next/image` | Image optimization |
| Cloudinary / Imgix | CDN + auto format conversion |

---

## Anti-Patterns
- Optimizing without measuring first — always profile before fixing
- Using `useEffect` + `useState` for data that could be server-rendered
- Importing entire libraries when only one function is needed (`import _ from 'lodash'`)
- Blocking render with synchronous scripts in `<head>`
- Setting `loading="eager"` on all images
- Ignoring mobile network conditions — test on throttled 3G
- Treating performance as a one-time task instead of continuous monitoring

---

## Checklist
- [ ] Lighthouse score measured before and after changes
- [ ] Bundle analyzer run — no unexpected large chunks
- [ ] All images have explicit width/height
- [ ] Web fonts use `font-display: swap` or `optional`
- [ ] Route-based code splitting implemented
- [ ] No unnecessary re-renders in critical paths
- [ ] Performance budget defined and enforced in CI
- [ ] Core Web Vitals within thresholds (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- [ ] Third-party scripts audited for impact

---

## Related Skills
- [frontend-engineer] — primary collaborator; performance applies to all frontend work
- [devops-engineer] — CDN, compression, HTTP/2, CI performance gates
- [monitoring] — define SLOs, alert on performance regressions
