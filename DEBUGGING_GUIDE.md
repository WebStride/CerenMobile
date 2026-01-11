# 🐛 End-to-End Debugging Guide - CerenMobile

## 📋 Overview

This guide will help you set up a complete debugging environment for the CerenMobile application, allowing you to trace code execution from the React Native mobile app through the Node.js backend. You'll be able to set breakpoints in both frontend and backend code and understand the complete flow of your application.

---

## 🎯 What You'll Achieve

- **Simultaneous Debugging**: Debug both React Native frontend and Node.js backend at the same time
- **Full Code Flow Visibility**: Trace user actions from UI → API calls → Database operations
- **Breakpoint Management**: Set breakpoints in TypeScript/JavaScript code on both sides
- **Live Reload**: Changes in code automatically refresh during debugging
- **Network Inspection**: See all API requests/responses between mobile app and backend

---

## 🛠️ Prerequisites

### Required Software

1. **VS Code** (already installed)
2. **Node.js** v18+ (check with `node --version`)
3. **Android Studio** (for Android emulator)
4. **Git** (for version control)

### Required VS Code Extensions

✅ **React Native Tools** (`msjsdiag.vscode-react-native`) - Already installed  
✅ **Debugger for Chrome** (optional, for enhanced debugging)

### Verify Installation

```powershell
# Check Node.js
node --version

# Check npm
npm --version

# Check if Android SDK is available
adb --version
```

---

## 📁 Project Structure Quick Reference

```
CerenMobile/
├── backend/                    # Node.js + Express + Prisma
│   ├── src/
│   │   ├── app.ts             # 🔴 Main server entry point
│   │   ├── routes.ts          # API route definitions
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   └── middleware/        # Auth, validation, etc.
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── .env                   # Environment variables (create from .env.example)
│
└── MobileAppUI/               # React Native + Expo
    ├── app/
    │   ├── index.tsx          # 🔴 App entry point
    │   ├── (tabs)/            # Main app screens
    │   ├── login/             # Authentication screens
    │   └── products/          # Product screens
    ├── services/
    │   └── api.ts             # 🔴 API client (backend communication)
    └── .env.development       # Environment variables (create from .env.development.example)
```

---

## ⚙️ Step 1: Environment Configuration

### 1.1 Backend Environment Setup

Create `backend/.env` based on the provided template:

```powershell
# Navigate to backend folder
cd backend

# Copy the example file
Copy-Item .env.example .env

# Edit the file with your actual credentials
code .env
```

**Required Environment Variables:**

```bash
# Database - Update with your MySQL credentials
DATABASE_URL="mysql://root:your_password@localhost:3306/ceren_mobile"

# Server Configuration
PORT=3002
HOST=0.0.0.0              # Important: Use 0.0.0.0 to allow emulator connections
NODE_ENV=development

# JWT Secrets - Generate strong secrets for production
ACCESS_TOKEN_SECRET=your-access-token-secret-key-here
REFRESH_TOKEN_SECRET=your-refresh-token-secret-key-here

# Twilio (for OTP/SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token-here

# External API
EXTERNAL_API_URL=http://3.109.147.219/test/api
EXTERNAL_API_USERNAME=testuser
EXTERNAL_API_PASSWORD=testpassword
```

**🔐 Generate Secure JWT Secrets:**

```powershell
# Run in PowerShell to generate random secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 1.2 Mobile App Environment Setup

Create `MobileAppUI/.env.development`:

```powershell
# Navigate to mobile app folder
cd MobileAppUI

# Copy the example file
Copy-Item .env.development.example .env.development

# Edit the file
code .env.development
```

**Required Environment Variables:**

```bash
# Backend API URL - Critical for Android Emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:3002

# Google Maps API Key
GOOGLE_MAPS_API_KEY=AIzaSyCLugNuaKypDiHsK8_aWubkwFUO893_SQc
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCLugNuaKypDiHsK8_aWubkwFUO893_SQc
```

**📱 Important IP Address Guide:**

| Device Type | API URL | Explanation |
|------------|---------|-------------|
| **Android Emulator** | `http://10.0.2.2:3002` | Special IP that routes to host machine's localhost |
| **iOS Simulator** | `http://localhost:3002` | Can use localhost directly |
| **Physical Device** | `http://192.168.x.x:3002` | Use your computer's LAN IP address |

**Find Your LAN IP (for physical devices):**

```powershell
# Windows
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

---

## 🗄️ Step 2: Database Setup

### 2.1 Ensure MySQL is Running

```powershell
# Check if MySQL service is running (Windows)
Get-Service -Name MySQL*

# Or check if you can connect
mysql -u root -p
```

### 2.2 Generate Prisma Client

```powershell
# Navigate to backend
cd backend

# Install dependencies (if not already done)
npm install

# Generate Prisma client
npm run db:generate

# Run migrations (if needed)
npm run db:migrate
```

### 2.3 Verify Database Connection

```powershell
# Start backend temporarily to test DB connection
npm run dev

# In another terminal, test the health endpoint
curl http://localhost:3002/test-db
```

---

## 📦 Step 3: Install Dependencies

### 3.1 Backend Dependencies

```powershell
cd backend
npm install
```

### 3.2 Mobile App Dependencies

```powershell
cd MobileAppUI
npm install
```

---

## 🚀 Step 4: Start Debugging Session

### Method 1: Using VS Code Compound Debugger (Recommended)

This method starts both backend and Android app debugging in one click.

1. **Open VS Code** in the project root folder

2. **Open the Debug Panel**:
   - Click the Debug icon in the left sidebar (🐛)
   - Or press `Ctrl+Shift+D`

3. **Select Debug Configuration**:
   - From the dropdown, choose: **"🚀 Full Stack Debug (Backend + Android)"**

4. **Start Debugging**:
   - Press `F5` or click the green play button
   - This will:
     - Start the Node.js backend server with debugger attached
     - Launch the Android app in debug mode

5. **Wait for App to Load**:
   - Backend should show: `App is running at port: http://0.0.0.0:3002`
   - Android app will build and launch on your emulator

### Method 2: Manual Step-by-Step (For More Control)

#### 4.1 Start Backend Debugger

1. In VS Code Debug panel, select **"Debug Backend (ts-node)"**
2. Press `F5` to start
3. Backend server should start on port 3002
4. You'll see debug console output

#### 4.2 Start Expo Metro Bundler

In a **new terminal**:

```powershell
cd MobileAppUI
npx expo start --dev-client --clear
```

Wait for Metro Bundler to start and show QR code.

#### 4.3 Launch Android App

In **another new terminal**:

```powershell
cd MobileAppUI
npm run android
```

Or press `a` in the Metro Bundler terminal to launch Android.

#### 4.4 Attach React Native Debugger

1. Once the app is running on the emulator
2. In VS Code Debug panel, select **"Attach to Expo"**
3. Press `F5` to attach debugger to the running app

---

## 🎯 Step 5: Setting Breakpoints and Debugging

### 5.1 Setting Breakpoints in Backend

**Common debugging points:**

1. **API Route Entry** - [backend/src/routes.ts](backend/src/routes.ts)
   - Click in the gutter next to line numbers to set breakpoints
   - Example: Line where routes are defined

2. **Authentication Middleware** - [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts)
   - Verify token validation
   - Check user authentication flow

3. **Service Layer** - [backend/src/services/](backend/src/services/)
   - Business logic execution
   - Example: `api.ts`, `product/getProducts.ts`

4. **Database Queries** - Any Prisma query
   - Watch database operations
   - Example: `prisma.products.findMany()`

### 5.2 Setting Breakpoints in Mobile App

**Common debugging points:**

1. **API Service** - [MobileAppUI/services/api.ts](MobileAppUI/services/api.ts)
   - Set breakpoints in `getRequest()`, `postRequest()` functions
   - Watch API calls being made

2. **Authentication** - [MobileAppUI/services/useAuth.ts](MobileAppUI/services/useAuth.ts)
   - Debug login/logout flow
   - Token management

3. **Screen Components** - [MobileAppUI/app/](MobileAppUI/app/)
   - User interactions
   - State management
   - Example: `login/index.tsx`, `products/index.tsx`

4. **API Response Handling**
   - Set breakpoints where `.then()` or `await` is used
   - Inspect response data structure

### 5.3 Example: Debugging Login Flow End-to-End

**Goal**: Trace the complete login flow from UI button click to backend authentication.

1. **Frontend Breakpoint**:
   - Open [MobileAppUI/app/login/index.tsx](MobileAppUI/app/login/index.tsx)
   - Find the login button's `onPress` handler
   - Set breakpoint at the start of the login function

2. **API Service Breakpoint**:
   - Open [MobileAppUI/services/api.ts](MobileAppUI/services/api.ts)
   - Set breakpoint in `postRequest()` function
   - This catches all API calls

3. **Backend Route Breakpoint**:
   - Open [backend/src/routes.ts](backend/src/routes.ts)
   - Find the `/auth/send-otp` or similar endpoint
   - Set breakpoint at route handler

4. **Backend Service Breakpoint**:
   - Open [backend/src/services/auth/](backend/src/services/auth/)
   - Set breakpoint in authentication service function

5. **Test the Flow**:
   - In the Android emulator, navigate to login screen
   - Enter phone number and tap login
   - Watch as execution stops at each breakpoint:
     1. UI button handler
     2. API service making request
     3. Backend route receiving request
     4. Backend service processing authentication
   - Use debugger controls to step through code

---

## 🔍 Debug Controls Reference

### VS Code Debugger Controls

| Button | Shortcut | Action |
|--------|----------|--------|
| ▶️ Continue | `F5` | Continue execution until next breakpoint |
| ⏭️ Step Over | `F10` | Execute current line, don't enter functions |
| ⏬ Step Into | `F11` | Enter into function calls |
| ⏫ Step Out | `Shift+F11` | Exit current function |
| 🔄 Restart | `Ctrl+Shift+F5` | Restart debugging session |
| ⏹️ Stop | `Shift+F5` | Stop debugging |

### Viewing Variables

- **Variables Panel**: Shows all variables in current scope
- **Watch Panel**: Add expressions to watch (e.g., `user.id`, `request.body`)
- **Call Stack**: See the sequence of function calls
- **Debug Console**: Execute code in current context

### Inspecting Network Requests

In the **Debug Console**, you can log:

```javascript
// In backend code
console.log('Request received:', request.body);
console.log('Headers:', request.headers);

// In mobile app code
console.log('API Response:', response.data);
console.log('User token:', await AsyncStorage.getItem('userToken'));
```

---

## 📊 Common Debugging Scenarios

### Scenario 1: "API Call Returns 401 Unauthorized"

**Debug Steps:**

1. Set breakpoint in [MobileAppUI/services/api.ts](MobileAppUI/services/api.ts) in `getRequest()`
2. Check if `Authorization` header is being set
3. Inspect the token value
4. Set breakpoint in [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts)
5. Verify token validation logic
6. Check if token matches expected format

**Watch Variables:**
- `headers.Authorization`
- `decoded` (decoded JWT payload)
- `user` (from database lookup)

### Scenario 2: "Products Not Loading"

**Debug Steps:**

1. Set breakpoint in products screen component
2. Check if API call is being made
3. Set breakpoint in [MobileAppUI/services/api.ts](MobileAppUI/services/api.ts) `getRequest()`
4. Verify the URL being called (should be `http://10.0.2.2:3002/products`)
5. Set breakpoint in [backend/src/controllers/product/](backend/src/controllers/product/)
6. Check Prisma query execution
7. Inspect returned data structure

**Watch Variables:**
- `EXPO_PUBLIC_API_URL` (ensure it's `http://10.0.2.2:3002`)
- `response.data` (API response)
- `products` (array of products from DB)

### Scenario 3: "Database Query Failing"

**Debug Steps:**

1. Set breakpoint before Prisma query
2. Inspect query parameters
3. Step into Prisma call
4. Check error in try-catch block
5. Verify database connection in `.env`

**Watch Variables:**
- `DATABASE_URL`
- Prisma query parameters
- Error messages

---

## 🌐 Network Debugging Tips

### Using Metro Bundler Debug Menu

1. **Open Debug Menu on Android Emulator**:
   - Press `Ctrl+M` (Windows)
   - Or shake the device

2. **Available Options**:
   - **Reload**: `R` key - Reload app
   - **Open Debugger**: Opens Chrome DevTools
   - **Enable Fast Refresh**: Auto-reload on code changes
   - **Enable Performance Monitor**: Show FPS and memory

### Using React Native Debugger (Optional Advanced Tool)

If you want enhanced debugging capabilities:

```powershell
# Install React Native Debugger
choco install react-native-debugger
# Or download from: https://github.com/jhen0409/react-native-debugger/releases
```

Benefits:
- Redux DevTools integration
- Network request inspection
- React component tree inspection

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to backend from Android emulator"

**Solutions:**

1. **Verify backend is running on `0.0.0.0`**:
   ```powershell
   # Check .env file
   HOST=0.0.0.0  # Not 127.0.0.1 or localhost
   ```

2. **Test backend accessibility**:
   ```powershell
   # From your development machine
   curl http://localhost:3002/health
   
   # Should return: {"status":"OK"}
   ```

3. **Verify emulator can reach host**:
   - Open Chrome in Android emulator
   - Navigate to `http://10.0.2.2:3002/health`
   - Should see JSON response

4. **Check firewall**:
   - Windows Firewall might be blocking Node.js
   - Allow Node.js through firewall when prompted

### Issue: "Metro Bundler won't start"

**Solutions:**

1. **Clear Metro cache**:
   ```powershell
   cd MobileAppUI
   npx expo start --clear
   ```

2. **Reset project**:
   ```powershell
   # Delete node_modules and reinstall
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

3. **Check port 8081**:
   ```powershell
   # Kill process using port 8081
   Get-NetTCPConnection -LocalPort 8081 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   ```

### Issue: "Breakpoints not hitting in TypeScript"

**Solutions:**

1. **Ensure source maps are enabled**:
   - Check `tsconfig.json` has `"sourceMap": true`
   - Backend should compile with source maps

2. **Use correct debug config**:
   - For TypeScript: Use "Debug Backend (ts-node)"
   - For compiled JS: Use "Debug Backend (compiled JS)"

3. **Verify breakpoint is on executable line**:
   - Not on empty lines or comments
   - Not on type definitions

### Issue: "Android app crashes on launch"

**Solutions:**

1. **Check environment variables**:
   ```powershell
   # Ensure .env.development exists
   cd MobileAppUI
   cat .env.development
   ```

2. **Rebuild Android app**:
   ```powershell
   cd MobileAppUI
   npx expo run:android --variant debug
   ```

3. **Check Android Studio logcat**:
   - Open Android Studio → Logcat
   - Filter by package name
   - Look for crash stack traces

### Issue: "Database connection fails"

**Solutions:**

1. **Verify MySQL is running**:
   ```powershell
   Get-Service -Name MySQL*
   # Should show "Running"
   ```

2. **Test connection string**:
   ```powershell
   mysql -h localhost -P 3306 -u root -p
   # Enter password and verify you can connect
   ```

3. **Regenerate Prisma client**:
   ```powershell
   cd backend
   npm run db:generate
   ```

---

## 📝 Best Practices for Debugging

### 1. Use Structured Logging

**Backend** (already uses pino):
```typescript
import logger from './lib/logger';

logger.info({ userId: user.id, action: 'login' }, 'User logged in');
logger.error({ error: err.message }, 'Database query failed');
```

**Mobile App**:
```typescript
console.log('🔐 [AUTH]', 'Token retrieved:', token);
console.log('📡 [API]', 'Calling endpoint:', url);
console.log('❌ [ERROR]', 'API call failed:', error);
```

### 2. Conditional Breakpoints

- Right-click on breakpoint → Edit Breakpoint
- Add condition: `userId === 2005` or `product.price > 100`
- Breakpoint only triggers when condition is true

### 3. Logpoints (Non-blocking logging)

- Right-click in gutter → Add Logpoint
- Enter message: `User ID: {userId}, Action: {action}`
- Logs without stopping execution

### 4. Debug Console for Quick Tests

While paused at breakpoint:
```javascript
// Execute code in current context
console.log(request.body)
Object.keys(user)
products.filter(p => p.price > 100)
```

---

## 🎓 Understanding Code Flow

### Typical Request Flow (Example: Fetching Products)

```
┌─────────────────────────────────────────────────────┐
│  MOBILE APP (React Native)                         │
├─────────────────────────────────────────────────────┤
│  1. User opens Products screen                     │
│     → app/products/index.tsx                       │
│     → useEffect() calls API                        │
│                                                     │
│  2. API Service makes request                      │
│     → services/api.ts: getRequest('/products')     │
│     → Adds Authorization header                    │
│     → Calls: http://10.0.2.2:3002/products        │
└────────────────┬────────────────────────────────────┘
                 │ HTTP GET Request
                 ▼
┌─────────────────────────────────────────────────────┐
│  BACKEND (Node.js + Express)                       │
├─────────────────────────────────────────────────────┤
│  3. Request hits Express server                    │
│     → routes.ts: GET /products route               │
│                                                     │
│  4. Authentication middleware                      │
│     → middleware/auth.ts                           │
│     → Verifies JWT token                           │
│     → Attaches user to request                     │
│                                                     │
│  5. Controller handles request                     │
│     → controllers/product/getProducts.ts           │
│     → Calls service layer                          │
│                                                     │
│  6. Service executes business logic                │
│     → services/product/getProducts.ts              │
│     → Calls Prisma for data                        │
│                                                     │
│  7. Database query                                 │
│     → Prisma Client: prisma.products.findMany()    │
│     → Executes MySQL query                         │
│                                                     │
│  8. Response sent back                             │
│     → Returns JSON: { data: [...products] }        │
└────────────────┬────────────────────────────────────┘
                 │ HTTP Response
                 ▼
┌─────────────────────────────────────────────────────┐
│  MOBILE APP (React Native)                         │
├─────────────────────────────────────────────────────┤
│  9. API Service receives response                  │
│     → services/api.ts: response.data               │
│                                                     │
│  10. Component updates state                       │
│     → setProducts(response.data)                   │
│                                                     │
│  11. UI re-renders with products                   │
│     → FlatList displays product cards              │
└─────────────────────────────────────────────────────┘
```

### Setting Breakpoints Along the Flow

To trace this completely:

1. [MobileAppUI/app/products/index.tsx](MobileAppUI/app/products/index.tsx) - `useEffect()` hook
2. [MobileAppUI/services/api.ts](MobileAppUI/services/api.ts) - `getRequest()` function
3. [backend/src/routes.ts](backend/src/routes.ts) - Products route definition
4. [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts) - Token verification
5. [backend/src/controllers/product/](backend/src/controllers/product/) - Request handler
6. [backend/src/services/product/](backend/src/services/product/) - Business logic
7. Any Prisma query line
8. Back to mobile app where response is received

---

## 🚀 Quick Start Checklist

Before each debugging session, verify:

- [ ] MySQL database is running
- [ ] `backend/.env` file exists with correct DATABASE_URL
- [ ] `MobileAppUI/.env.development` exists with correct API_URL
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Mobile app dependencies installed (`cd MobileAppUI && npm install`)
- [ ] Prisma client generated (`cd backend && npm run db:generate`)
- [ ] Android emulator is running
- [ ] No other processes using port 3002 or 8081

---

## 📚 Additional Resources

### Official Documentation
- [React Native Debugging](https://reactnative.dev/docs/debugging)
- [Expo Debugging](https://docs.expo.dev/debugging/runtime-issues/)
- [VS Code Node.js Debugging](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)
- [Prisma Debugging](https://www.prisma.io/docs/concepts/components/prisma-client/debugging)

### Useful Commands Reference

```powershell
# Backend
cd backend
npm run dev              # Start development server
npm run build            # Compile TypeScript
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations

# Mobile App
cd MobileAppUI
npm run android          # Build and run on Android
npm run ios             # Build and run on iOS (Mac only)
npx expo start          # Start Metro bundler
npx expo start --clear  # Start with cache cleared

# Debugging
adb logcat              # View Android logs
adb devices             # List connected Android devices
```

---

## 🎯 Next Steps After Setup

Once you have debugging working:

1. **Explore the codebase systematically**:
   - Trace authentication flow
   - Understand product listing and cart management
   - Study order placement process

2. **Document your findings**:
   - Take notes on how different features work
   - Map out the data flow for key features

3. **Test different scenarios**:
   - What happens when network fails?
   - How are errors handled?
   - What validations are in place?

4. **Optimize based on insights**:
   - Identify performance bottlenecks
   - Find areas for code improvement
   - Understand the architecture decisions

---

## ❓ Getting Help

If you encounter issues not covered in this guide:

1. Check VS Code Output panel for detailed error messages
2. Review Android Studio Logcat for mobile app crashes
3. Check backend console for server errors
4. Verify environment variables are loaded correctly

---

**Happy Debugging! 🎉**

You now have a complete end-to-end debugging setup. Use this to gain deep knowledge of your application's architecture and code flow.
