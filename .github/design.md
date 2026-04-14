# CerenMobile Design System

This file defines the product, UI, and interaction baseline for CerenMobile.

The app should feel like a dependable wholesale ordering tool for repeat business customers. It is not a luxury catalog, a playful consumer marketplace, or a generic admin dashboard.

---

## Product Direction

CerenMobile is a mobile-first B2B commerce app for store owners and distributors who need to:

- log in quickly with OTP
- confirm the correct store context
- browse products with clear pricing and units
- manage MOQ-sensitive cart quantities
- place orders confidently
- review orders and invoices without confusion

The design should optimize for speed, clarity, trust, and repeat usage under real mobile conditions.

## Core UX Principles

### 1. Trust Before Delight

The UI should communicate reliability first:

- prices and units must be easy to scan
- store context must always be understandable
- order actions must feel safe and deliberate
- status, totals, and dates must never be visually ambiguous

### 2. Mobile-First Practicality

Most critical actions happen on phones in short bursts.

- favor one-handed interactions where practical
- keep primary actions within easy thumb reach
- reduce form friction and typing effort
- prefer progressive disclosure over dense screens

### 3. Fast Repeat Purchase Flow

This is a reordering product, not only a discovery product.

- make product rails and category browsing fast
- highlight quantity adjustment and add-to-cart actions
- preserve selected store and address context
- reduce navigation hops for common tasks

### 4. Graceful Network Reality

The app must remain understandable on slow or unreliable connections.

- always show loading, empty, and error states
- avoid silent failures
- use optimistic UI carefully for cart and favourites
- show retry options for failed network-dependent actions

## Architecture-Aware UX Rules

The design system must respect the architecture in `docs/architecture.md`.

### User vs Store Context

The app has two identities:

- authenticated app user
- selected business store

Design implications:

- account UI represents the logged-in person
- pricing, cart, favourites, orders, and invoices represent the selected store
- store context must be visible or easy to confirm before store-scoped actions

### Guest vs Authenticated Modes

The UI must clearly support different capability levels.

- guest mode can browse but should not feel identical to a fully authenticated store session
- if pricing is unavailable, the UI should explicitly show that state instead of implying missing data
- if a store is not selected yet, store-scoped actions should guide the user instead of failing late

### MOQ and Quantity Safety

Minimum order quantity is core business logic, not a minor UI detail.

- always surface MOQ near quantity controls
- quantity decrement behavior must not hide why a lower value is disallowed
- cart and product cards must keep quantity controls understandable at a glance

## Brand Direction

CerenMobile should feel:

- fresh
- trustworthy
- efficient
- clean
- business-ready

It should not feel:

- luxury or editorial
- overly playful
- dark and heavy
- visually noisy
- like a finance dashboard

The current visual language already points in the right direction: white surfaces, green brand accents, product-first cards, and direct CTAs.

## Color System

Use a restrained palette built around greens, clean neutrals, and utility colors.

| Token | Value | Usage |
|---|---|---|
| Brand Primary | `#BCD042` | Brand accent, onboarding CTA, highlighted primary accents |
| Brand Primary Dark | `#15803D` | Add-to-cart, strong confirmation actions, success-weighted buttons |
| Brand Primary Soft | `#EAF4C3` | Selected chips, soft highlights, informational green surfaces |
| Canvas | `#F7F8F2` | App-level background where full white feels too stark |
| Surface | `#FFFFFF` | Cards, sheets, content panels |
| Surface Alt | `#F3F4F6` | Inputs, placeholders, image fallback backgrounds |
| Text Primary | `#111827` | Primary readable text |
| Text Secondary | `#6B7280` | Supporting text |
| Text Muted | `#9CA3AF` | Secondary metadata and icon defaults |
| Border | `#E5E7EB` | Hairlines, dividers, card borders |
| Success | `#15803D` | Success states and positive confirmation |
| Warning | `#D97706` | Caution, pending actions, secondary alerts |
| Error | `#DC2626` | Validation and failure states |
| Info | `#2563EB` | Informational banners or neutral status |
| Price Request | `#F97316` | Price-on-request badges and actions |

Color guidance:

- use green for primary commerce actions
- reserve orange for price-request or attention-needed pricing states
- do not introduce unrelated accent colors without a product reason
- avoid heavy gradients as the primary visual identity

## Typography

Use a clean, readable sans-serif system appropriate for operational mobile usage.

Current code already uses Open Sans in onboarding, so future UI should stay within a similar practical sans-serif direction unless a full typography migration is planned.

| Role | Size | Weight | Notes |
|---|---|---|---|
| Display | `32-40` | `700` | Onboarding headlines and key hero moments only |
| H1 | `28-32` | `700` | Major screen headings |
| H2 | `22-24` | `700` | Section headings |
| H3 | `18-20` | `600` | Card titles and modal section titles |
| Body Large | `16-18` | `400-600` | Important supporting copy |
| Body | `14-16` | `400-500` | Default content text |
| Caption | `12-13` | `400-500` | Metadata, helper text, status support |
| Label | `12-14` | `600-700` | Buttons, chips, form labels |

Typography guidance:

- prioritize readability over stylization
- avoid tiny text for units, pricing, or status
- use consistent casing for actions and labels
- keep product information visually denser than marketing copy, but never cramped

## Spacing and Layout

Use a compact mobile spacing scale with clear hierarchy.

- `4, 8, 12, 16, 20, 24, 32, 40, 48`
- standard screen horizontal padding: `16`
- card padding: `12-16`
- modal and bottom-sheet padding: `20-24`
- vertical rhythm should feel airy enough to scan quickly, especially in lists

Layout guidance:

- respect safe areas on all top-level screens
- keep headers compact and functional
- long lists should use `FlatList` or optimized list rendering
- prefer sticky or persistent summary areas only when they materially help checkout or order review

## Radius, Borders, and Elevation

| Token | Value | Usage |
|---|---|---|
| Radius Small | `8` | Chips, small controls |
| Radius Medium | `12` | Inputs, product cards |
| Radius Large | `16` | Sheets, larger cards, modals |
| Radius XL | `24` | Hero buttons or featured panels only |
| Border Default | `1px solid #E5E7EB` | Standard separators |
| Shadow Soft | subtle | Floating controls and cards |

Guidance:

- keep shadows soft and rare
- rely on spacing and borders before heavy elevation
- avoid glossy or overdesigned cards

## Core Screen Patterns

### Onboarding

- full-screen visual with brand logo and concise value proposition
- one clear primary CTA
- copy should stay short and business-focused

### Login and OTP

- minimize fields and steps
- keep phone entry and OTP verification extremely clear
- show resend and validation states without clutter
- errors must be specific and actionable

### Home / Shop

- top area should prioritize search, store/address context, and product discovery
- use horizontally scrollable rails for key product groups only when performance remains strong
- category cards should be visually consistent and quick to scan
- avoid overloading the first screen with too many competing promotional blocks

### Product Cards

Each product card should communicate, in order:

- image
- product name
- unit or pack size
- MOQ if relevant
- price or price-request state
- favourite and cart action

Cards should feel tappable and operational, not decorative.

### Product Detail

- place image, title, unit information, price, MOQ, and quantity action above secondary details
- supporting details like description or nutrition should not push commerce actions too far down
- similar products should support cross-sell without distracting from the primary action

### Cart and Checkout

- quantity controls must remain easy to use
- line items must show units and pricing clearly
- totals and delivery details should be grouped cleanly
- confirmation action should be unmissable but not visually aggressive

### Orders and Invoices

- show order number, invoice number, dates, status, and totals prominently
- status chips should be scannable and consistent
- timeline or detail views should prefer clarity over decoration

### Account, Store Selection, and Address

- make current store and saved address states explicit
- if multiple stores exist, switching context should be deliberate and reversible
- forms should reduce cognitive load with grouped fields and clear helper text

## Motion and Interaction

Motion should support orientation and feedback, not entertainment.

| Token | Value | Usage |
|---|---|---|
| Fast | `120-160ms` | Small tap responses |
| Standard | `180-220ms` | Cards, buttons, panel transitions |
| Slow | `260-320ms` | Modals and sheet transitions |

Motion rules:

- use subtle press feedback on tappable elements
- use smooth but restrained screen transitions
- avoid heavy parallax or ornamental animations in business flows
- loading skeletons or shimmer are preferred over spinner-only waiting for list content
- respect reduced motion where supported

## Feedback States

Every API-dependent screen or action should define all of these states:

- initial loading
- refreshing
- empty state
- inline error
- retry path
- success confirmation when action impact matters

Guidance:

- price-loading and auth-loading states should not look like broken UI
- destructive actions must use confirmation when reversal is not trivial
- optimistic updates must rollback cleanly on failure

## Accessibility

- minimum 44x44 touch targets
- readable contrast on all buttons and chips
- do not rely on color alone for status or validation
- support dynamic text where practical
- icon-only controls require accessible labels
- keep modals and sheets navigable with screen readers

## Performance-Oriented Design Rules

Because this is an Expo / React Native app with data-heavy commerce flows:

- avoid overly complex nested scroll behavior
- prefer virtualized lists for product-heavy screens
- keep image placeholders stable to reduce layout shift
- do not introduce animation that competes with scroll performance
- avoid modal stacking unless absolutely necessary

## Implementation Guidelines

- centralize design tokens instead of repeating hardcoded values across screens
- reuse shared components for quantity selection, price request, login-required prompts, and empty states
- keep product and order status visuals consistent across screens
- use `expo-image` placeholders and caching for product imagery
- prefer NativeWind utility consistency, but extract repeated visual patterns into reusable components

## Anti-Patterns

- dark, heavy, or luxury-styled themes unrelated to wholesale commerce
- generic SaaS dashboard layouts for customer-facing mobile screens
- hidden store context for store-scoped actions
- burying MOQ, pack size, or pricing under secondary text
- relying on long paragraphs where short operational labels would work better
- mixing too many button styles on one screen
- introducing large marketing banners that slow down the primary order flow

## Definition of Good Design in This Project

A good CerenMobile screen should let a returning wholesale buyer quickly understand:

- who they are signed in as
- which store they are operating
- what a product costs or why pricing is unavailable
- what quantity they can order
- what action to take next

If a screen looks attractive but makes any of those answers harder to find, the design is wrong for this product.