---
name: seo-geo
description: Universal SEO and GEO (Generative Engine Optimization) skill covering traditional search engine optimization, AI citation optimization, JSON-LD schema markup, meta tag strategy, robots.txt, and platform-specific strategies for ChatGPT, Perplexity, Google SGE, Claude, and Bing Copilot. Apply when auditing pages, adding schema markup, optimizing content for AI visibility, or improving Core Web Vitals for search ranking. Works with Next.js, React, and any web framework.
applyTo: ["**/*.tsx", "**/*.jsx", "**/*.html", "**/*.ts", "**/layout.tsx", "**/page.tsx", "**/metadata*", "**/sitemap*", "**/robots*"]
teamRole: Engineering
relatedSkills:
  - frontend-engineer
  - frontend-performance
  - ui-design
  - content-strategy
expertise:
  - Technical SEO auditing
  - GEO - Generative Engine Optimization
  - JSON-LD schema markup
  - Meta tags and Open Graph
  - robots.txt and crawlability
  - AI search engine citation strategies
  - Core Web Vitals for SEO
  - Next.js metadata API
  - Structured data validation
---

# SEO / GEO Optimization Skill

## Quick Reference

```
SEO = Search Engine Optimization → rank on Google/Bing (by pages)
GEO = Generative Engine Optimization → get cited by AI engines (ChatGPT, Perplexity, Claude, Gemini)

Key insight: AI search engines don't rank pages — they CITE sources.
Being cited is the new "ranking #1". The two disciplines are complementary, not competing.
```

## Role Overview
SEO/GEO work ensures your content is discoverable by both traditional crawlers and generative AI systems. This skill covers the full spectrum: technical health, structured data, content formatting, AI crawler access, and platform-specific citation strategies. Apply it when building new pages, auditing existing ones, or optimizing for search visibility.

---

## Workflow

### Step 1: Technical SEO Audit

For each target page, check:

**Meta Tags (required for every page)**
```tsx
// Next.js App Router — layout.tsx or page.tsx
export const metadata: Metadata = {
  title: "Primary Keyword - Brand | Secondary Keyword",     // 50–60 chars
  description: "Compelling description with keyword.",      // 150–160 chars
  openGraph: {
    title: "Same or similar to title",
    description: "Slightly expanded description for social",
    url: "https://yourdomain.com/page-slug",
    siteName: "Brand Name",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",                                        // or "article"
  },
  twitter: {
    card: "summary_large_image",
    title: "Title",
    description: "Description",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://yourdomain.com/page-slug",
  },
};
```

**robots.txt — allow all AI crawlers**
```
# apps/retailerShop/public/robots.txt

User-agent: *
Allow: /

# Traditional engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# AI engines — must be explicitly allowed
User-agent: GPTBot           # OpenAI / ChatGPT
Allow: /

User-agent: ChatGPT-User     # ChatGPT browsing
Allow: /

User-agent: PerplexityBot    # Perplexity
Allow: /

User-agent: ClaudeBot        # Claude AI
Allow: /

User-agent: anthropic-ai     # Anthropic
Allow: /

User-agent: Googlebot-Extended  # Google SGE / AI Overviews 
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
```

**Sitemap — Next.js App Router**
```tsx
// app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://yourdomain.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://yourdomain.com/sales",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
```

**Core technical checks (verify each):**
```
✅ H1 present and contains primary keyword (exactly one per page)
✅ Images have descriptive alt text (not "image1.png")
✅ Internal links use descriptive anchor text
✅ External links have rel="noopener noreferrer"
✅ Page loads in < 3 seconds (use Lighthouse or WebPageTest)
✅ Mobile-friendly (no horizontal scroll, tap targets ≥ 44px)
✅ Canonical URL set on every page
✅ No duplicate title/description across pages
```

---

### Step 2: JSON-LD Structured Data

Structured data is critical for both Google Rich Results and AI engine citations. Add to `<head>` or as a `<script>` in Next.js layout/page.

**WebPage / Article (most pages)**
```tsx
// Component: StructuredData.tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",               // or "WebPage", "BlogPosting"
  "headline": "Title of the page",
  "description": "Page description",
  "author": {
    "@type": "Organization",
    "name": "Brand Name",
    "url": "https://yourdomain.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Brand Name",
    "logo": {
      "@type": "ImageObject",
      "url": "https://yourdomain.com/logo.png"
    }
  },
  "datePublished": "2026-01-01",
  "dateModified": new Date().toISOString(),
  "mainEntityOfPage": "https://yourdomain.com/page-slug"
};

// In your page component:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

**FAQPage (+40% AI visibility — highest impact schema)**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is [topic]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "According to [authoritative source], [answer with a specific statistic or data point]. [Expand with 2-3 sentences of clear explanation]."
      }
    },
    {
      "@type": "Question",
      "name": "How does [feature/product] work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Direct answer first]. [Supporting detail]. [Source or data point]."
      }
    }
  ]
}
```

**Organization (homepage / about page)**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Brand Name",
  "url": "https://yourdomain.com",
  "logo": "https://yourdomain.com/logo.png",
  "sameAs": [
    "https://twitter.com/brand",
    "https://linkedin.com/company/brand"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": "English"
  }
}
```

**SoftwareApplication (product/app pages)**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AccountSaathi",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "AI-powered accounting tool for managing sales and purchase data.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR"
  }
}
```

**Validate structured data at:**
- https://search.google.com/test/rich-results
- https://validator.schema.org/

---

### Step 3: GEO — AI Citation Optimization

Based on the Princeton GEO research (9 methods with documented visibility boosts):

| Method | Visibility Boost | How to Apply |
|--------|-----------------|--------------|
| Cite authoritative sources | +40% | Link to research papers, official docs, reputable statistics |
| Add statistics | +37% | Include specific numbers: "72% of users...", "saves 3 hours/week" |
| Add expert quotes | +30% | "According to [expert/source], ..." |
| Authoritative tone | +25% | Write with confident, expert language — no hedging |
| Plain language | +20% | Simplify jargon; explain technical terms on first use |
| Technical terminology | +18% | Use domain-specific terms correctly (signals expertise) |
| Vocabulary diversity | +15% | Avoid repeating the same phrase — use synonyms |
| Fluency optimization | +15–30% | Short sentences, active voice, clear paragraph flow |
| ❌ Keyword stuffing | **-10%** | Do NOT repeat keywords unnaturally — hurts AI visibility |

**Best combination: Fluency + Statistics = Maximum boost**

**Content structure for AI citations:**
```
✅ Answer-first format: lead with the direct answer, then expand
✅ Clear H1 > H2 > H3 hierarchy (AI engines use headers to extract sections)
✅ Bullet points and numbered lists (easier to cite and quote)
✅ Tables for comparison data (AI engines love structured comparisons)
✅ Short paragraphs (2–3 sentences max per paragraph)
✅ Include a FAQ section on every important page (highest GEO impact)
✅ Statistics with sources: "According to X, 60% of..."
✅ Date content clearly — AI engines prefer content updated within 30 days
```

---

### Step 4: Platform-Specific Strategies

#### Google AI Overviews (SGE)
```
- Optimize for E-E-A-T: Experience, Expertise, Authoritativeness, Trustworthiness
- Use structured data (especially FAQPage and Article)
- Build topical authority via content clusters + strong internal linking
- Include authoritative citations (+132% AI Overview visibility)
- Target featured snippet format: answer in first 2 sentences
```

#### ChatGPT / OpenAI
```
- Allow GPTBot in robots.txt (checked above)
- Build branded domain authority — ChatGPT cites branded domains 11% more
- Update content within 30 days of ChatGPT's knowledge cutoff (3.2x more citations)
- Format content to match ChatGPT's response style (conversational + factual)
- High backlink count helps: >350K referring domains = 8.4 avg citations
```

#### Perplexity
```
- Allow PerplexityBot in robots.txt
- FAQPage schema is highest-performing for Perplexity citations
- Host downloadable PDF versions of key content (Perplexity prioritises PDFs)
- Focus on semantic relevance, not just keyword matching
```

#### Microsoft Copilot / Bing
```
- Ensure Bing indexing (verify at bing.com/webmaster)
- Page speed < 2 seconds is more important for Bing than Google
- LinkedIn and GitHub presence helps with Microsoft ecosystem signals
- Clear entity definitions in content (Copilot is entity-aware)
```

#### Claude AI
```
- Claude indexes via Brave Search — ensure Brave indexing, not just Google
- High factual density is preferred: data > opinion
- Structural clarity: clear, extractable sections
- ClaudeBot must be allowed in robots.txt
```

---

### Step 5: Next.js-Specific Implementation

**Dynamic metadata per page (App Router)**
```tsx
// app/[slug]/page.tsx
import { Metadata } from "next";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPageData(params.slug);

  return {
    title: `${page.title} | AccountSaathi`,
    description: page.description,
    openGraph: {
      title: page.title,
      description: page.description,
      images: [page.ogImage ?? "/og-default.png"],
    },
    alternates: {
      canonical: `https://yourdomain.com/${params.slug}`,
    },
  };
}
```

**Reusable StructuredData component**
```tsx
// components/StructuredData.tsx
interface Props {
  data: Record<string, unknown>;
}

export function StructuredData({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Usage in page.tsx
import { StructuredData } from "@/components/StructuredData";

const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", ... };

export default function Page() {
  return (
    <>
      <StructuredData data={faqSchema} />
      {/* page content */}
    </>
  );
}
```

**Next.js image optimization (required for LCP)**
```tsx
// Always use next/image — never <img> for above-the-fold content
import Image from "next/image";

<Image
  src="/hero.png"
  alt="Descriptive text explaining the image content"  // Required for SEO
  width={1200}
  height={630}
  priority                                            // For above-the-fold images
  sizes="(max-width: 768px) 100vw, 1200px"
/>
```

---

### Step 6: Validate & Monitor

**Schema validation**
```bash
# Google Rich Results Test
open "https://search.google.com/test/rich-results"

# Schema.org Validator
open "https://validator.schema.org/"

# Bing Markup Validator
open "https://www.bing.com/webmaster/tools/markup-validator"
```

**Check AI bot access**
```bash
# Verify robots.txt allows all AI crawlers
curl -s "https://yourdomain.com/robots.txt" | grep -E "GPTBot|PerplexityBot|ClaudeBot|anthropic"
```

**Performance (affects SEO ranking)**
```bash
# Run Lighthouse (CLI)
npx lighthouse https://yourdomain.com --output html --output-path ./lighthouse-report.html

# Core Web Vitals targets:
# LCP (Largest Contentful Paint): < 2.5s
# FID / INP (Interaction to Next Paint): < 200ms
# CLS (Cumulative Layout Shift): < 0.1
```

---

## SEO/GEO Audit Report Template

```markdown
## SEO/GEO Audit — [Page Name]
Date: [date]

### Technical SEO
- [ ] Title tag: ✅/❌ — [note]
- [ ] Meta description: ✅/❌ — [note]
- [ ] H1 present and contains keyword: ✅/❌
- [ ] Canonical URL set: ✅/❌
- [ ] robots.txt allows AI crawlers: ✅/❌
- [ ] Sitemap includes this page: ✅/❌
- [ ] Page speed < 3s: ✅/❌ — [actual time]
- [ ] Mobile-friendly: ✅/❌

### Structured Data
- [ ] JSON-LD present: ✅/❌ — [type]
- [ ] Validates with no errors: ✅/❌
- [ ] FAQPage schema added: ✅/❌

### GEO
- [ ] Answer-first content structure: ✅/❌
- [ ] Statistics with sources included: ✅/❌
- [ ] FAQ section present: ✅/❌
- [ ] Content updated within 30 days: ✅/❌

### Priority Actions
1. [Most impactful fix]
2. [Second fix]
3. [Third fix]
```

---

## Checklist — Before Shipping Any Page

```
Technical SEO:
✅ Unique title tag (50–60 chars) with primary keyword
✅ Unique meta description (150–160 chars)
✅ Exactly one H1 per page
✅ Canonical URL set
✅ Open Graph image (1200×630px)
✅ Images have descriptive alt text
✅ robots.txt allows AI crawlers (GPTBot, PerplexityBot, ClaudeBot)
✅ Page in sitemap.xml

Structured Data:
✅ JSON-LD schema appropriate to page type
✅ Validated (no errors in Rich Results Test)
✅ FAQPage schema if page has Q&A content
✅ Organization schema on homepage

GEO:
✅ Answer-first paragraph structure
✅ At least one statistic with attribution
✅ FAQ section included
✅ Content dated or recently updated

Performance:
✅ LCP < 2.5s
✅ CLS < 0.1
✅ next/image used for all meaningful images
✅ No render-blocking resources
```

## Anti-Patterns
```
❌ Generic meta descriptions shared across pages
❌ Missing alt text ("image.png" is not alt text)
❌ Blocking GPTBot / PerplexityBot / ClaudeBot in robots.txt
❌ Keyword stuffing — hurts AI visibility by -10%
❌ Opinion-heavy content with no statistics or citations
❌ Walls of text — no headers, no bullets, no structure
❌ <img> instead of next/image (misses LCP optimization)
❌ No FAQ section — single highest-impact GEO addition per page
❌ Ignoring Bing/Brave indexing — Copilot and Claude use them
❌ Content older than 30 days with no refresh — loses AI citation priority
```

## Related Tools
- Google Search Console: https://search.google.com/search-console
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/
- Bing Webmaster Tools: https://bing.com/webmaster
- PageSpeed Insights: https://pagespeed.web.dev/
- Lighthouse CLI: `npx lighthouse <url>`
