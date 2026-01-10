---
trigger: always_on
---

***

# Ceren Mobile App -  Antigravity AI Instructions

## Project Overview  
This project is a Mobile Application for wholesalers to buy goods from us - a production company. The app allows users to browse products, place orders, and manage their accounts seamlessly. Using Google Maps API, users can locate nearby distributors and track deliveries in real-time. The backend is powered by a Node.js server with a MySQL database, ensuring robust data management and security. Prisma ORM is utilized for efficient database interactions, while RESTful APIs facilitate smooth communication between the frontend and backend. The app is built with React Native and Expo, providing a responsive and user-friendly interface across various devices. Using MSG91 SMS API, the app sends order confirmations and delivery updates via SMS to enhance user engagement and satisfaction and for otp verification during signup/login.

**Tech Stack:** React Native, Expo, MySQL, Node.js, Prisma, RESTful APIs
***

## AI Documentation Integration

### Context7 MCP Extension  
This project uses the *Context7 MCP* VS Code extension for accessing real-time and up-to-date library documentation:

- **Extension:** upstash.context7-mcp (pre-installed per `.vscode/extensions.json`)  
- **Function:** Query Next.js, Node.js, Leegality API, Supabase, and other libraries instantly via Copilot  
- **Instruction:** Ask Copilot to fetch documentation via Context7 whenever you need to clarify library-specific usage or APIs

### Reference Documentation Sources

| Technology            | Official Docs & Guides                                                                   |
|----------------------|-----------------------------------------------------------------------------------------|
| Expo Folder structure           | [https://expo.dev/blog/expo-app-folder-structure-best-practices](https://expo.dev/blog/expo-app-folder-structure-best-practices)                                          |

| Expo Best Practices   | [https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps](https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps)                              |
| Supabase             | [https://supabase.com/docs](https://supabase.com/docs)                                  |
                                |

| Node.js Best Practices | [Node.js Best Practices](https://dev.to/mehedihasan2810/nodejs-best-practices-a-guide-for-developers-4d65) |
| Prisma Documentation  | [https://www.prisma.io/docs/](https://www.prisma.io/docs)                              |

| Expo Google Maps Integration | [https://docs.expo.dev/versions/latest/sdk/map-view/](https://docs.expo.dev/versions/latest/sdk/map-view/) |

| MSG91 SMS Integration | [https://docs.msg91.com/overview](https://docs.msg91.com/overview) |
***

## Expectations from Copilot

- **Role:** Act as a Senior Architect and Senior Full-Stack Developer, Mobile App Developer with expertise in React Native, Expo, Node.js, MySQL, Prisma, and RESTful APIs and SMS API integrations  
- **Problem Solving:** Provide efficient, scalable, and maintainable solutions for complex problems
- **Code Quality:** Follow industry standards, security best practices, clean architecture, and scalable design principles strictly  
- **Focus Areas:**  
  - Modular, maintainable code with clear separation of concerns  
  - Robust error handling and logging for debugging  
  - Efficient database schema design aligned with RLS (Row Level Security) principles in Supabase  
  - Responsive, accessible frontend components in Expo/React Native  
  - Performance optimization techniques for mobile applications  
  - Comprehensive testing strategies (unit, integration, end-to-end) using appropriate frameworks
  - Secure API integrations, including validation and sanitization in Node.js backend  

***

## Best Practices Guidelines for Developers

### Design & Architecture

- Favor modular, layered architecture (e.g., clear separation of frontend, backend, and database layers)  
- Apply SOLID principles and DRY (Don't Repeat Yourself) in code  
- Design APIs to be RESTful or follow modern GraphQL approaches, document thoroughly  
- Use environment variables and secrets management securely (avoid hardcoding keys)  

### Backend & Database

- Use Prisma ORM effectively for type-safe database interactions  
- Normalize database schema for maintainability, denormalize smartly for performance  
- Use server-side validation and input sanitization  
- Implement centralized error handling and logging (Structured logs for easier debugging)  

### Frontend Development

- Use React Native best practices for component structure and state management (e.g., Context API, Redux) 
- Optimize performance via code-splitting, lazy loading, and memoization  
- Follow a11y (accessibility) standards for all UI elements  
- Implement responsive design fitting typical user devices  

### Debugging & Testing

- Write unit and integration tests (e.g., Playwright, Jest) covering critical workflows  
- Use logging and monitoring to trace bugs in production  
- Leverage VS Code debugging tools and extensions for efficient dev cycles  

***

## Context7 Integration Usage

For real-time, up-to-date ABP or other library docs:  
- Prompt Copilot to query Context7 MCP extension before generating code or answering questions  

***

If you want, this file can be extended with templates for prompts, testing checklists, or team best practices summaries.

***




### 1) Environment & Secrets (.env) — required keys
List all env vars the project expects so devs know what to provide (use secure secret store for production).
- BACKEND
  - DATABASE_URL
  - ACCESS_TOKEN_SECRET
  - REFRESH_TOKEN_SECRET
  - TWILIO_ACCOUNT_SID
  - TWILIO_AUTH_TOKEN
  - TWILIO_VERIFY_SERVICE_SID
  - MSG91_API_KEY (if used)
  - PORT
- MOBILE (Expo / MobileAppUI)
  - GOOGLE_MAPS_API_KEY
  - EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (if using public config)
  - EAS_BUILD_PROFILE (preview/production)
  - API_BASE_URL

### 2) Maps — iOS configuration checklist
If you intend Google Maps on iOS (current MapView uses provider google):
- For Expo managed + EAS:
  - Add plugin in app.json/app.config.js:
    - "plugins": [["react-native-maps", { "provider": "google" }]]
  - Add API key in expo config extras and ios.infoPlist:
    - NSLocationWhenInUseUsageDescription
  - Build with EAS (prebuild + pod install + eas build)
- For Apple Maps fallback / simple option:
  - Remove provider={PROVIDER_GOOGLE} on iOS or guard by Platform.OS
- Required Info.plist keys:
  - NSLocationWhenInUseUsageDescription
  - NSLocationAlwaysAndWhenInUseUsageDescription (if background needed)

### 3) Expo / EAS build quick commands
- Install EAS if needed:
  - npm install -g eas-cli
- Preview build (Android):
  - cd MobileAppUI && eas build --platform android --profile preview
- Local android release:
  - cd MobileAppUI && npx expo run:android --variant release
- iOS GoogleMaps using EAS:
  - configure app.json -> eas build -> eas build --platform ios --profile production

### 4) Testing OTP bypass (dev only)
- Use a clearly-documented test OTP like `123456` in backend auth service for local/dev only.
- Gate the bypass behind NODE_ENV === 'development' or a dedicated env var (e.g., OTP_TEST_BYPASS=true) to avoid accidental production bypass.

### 5) Database / Prisma
- Migrations:
  - npx prisma migrate dev --name init
  - npx prisma generate
- Seed data:
  - Provide a script under prisma/seed.ts and add "prisma:seed" npm script
- When inserting test data manually, include explicit IDs only if you understand auto-increment implications. Use transactions for multi-table seed (orders + orderitems + invoices + invoiceitems).

### 6) Seed / Test Data Utilities
- Add small SQL or JS seed scripts for:
  - Creating test customers (e.g., CustomerID 2005)
  - Creating Orders, OrderItems, Invoices, InvoiceItems consistently
- Example workflow:
  1. Insert Orders
  2. Capture inserted OrderIDs
  3. Insert OrderItems referencing those OrderIDs
  4. Insert Invoices referencing Orders
  5. Insert InvoiceItems referencing Invoices

### 7) Product images & assets
- Keep images in MobileAppUI/assets and reference via require() to avoid bundling issues.
- Add a fallback avatar image for profile screens (use a human-looking image that respects licensing).

### 8) CI / PR checks
- Add linting and typecheck steps to CI:
  - npm run lint
  - npm run test
  - npx prisma validate
- Run `expo prebuild` only in CI when native changes are required.

### 9) Security & best practices reminders
- Never commit .env or API keys.
- Use least-privilege for DB users and API keys.
- For whitelist IP during testing, prefer your public IP/32. For universal testing only, use 0.0.0.0/0 and ::/0 (temporary).

### 10) Debugging & logs
- Backend: centralize errors and use structured logs (JSON) for easier filtering.
- Mobile: capture Sentry or similar for release diagnostics (optional but recommended).

### 11) Helpful commands (dev reference)
- Get public IP (Mac):
  - curl https://ifconfig.me
  - curl https://ipinfo.io/ip
- Prisma introspect (if DB schema changed):
  - npx prisma db pull
- Run backend:
  - cd backend && npm run dev
- Run mobile:
  - cd MobileAppUI && npx expo start -c

### 12) Minimal checklist before production builds
- Remove OTP bypass and ensure TWILIO env vars are present
- Replace universal whitelist with restricted IPs
- Rotate any test API keys
- Run security scans and dependency updates