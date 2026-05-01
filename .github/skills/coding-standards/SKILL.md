---
name: coding-standards
description: 'Project coding standards enforcement for CerenMobile. Covers TypeScript strictness, naming conventions, import ordering, component structure, API patterns, and code style rules. Use when writing new code, reviewing existing code, or onboarding to ensure consistency across the codebase.'
argument-hint: 'Which part of the codebase are you working on? (mobile, backend, shared)'
origin: ECC
---

# Coding Standards — CerenMobile

**Applies to:** All TypeScript code in `MobileAppUI/` and `backend/src/`.  
**Trigger:** Before writing any new code, or when reviewing existing code.

> "Consistent code is predictable code. Predictable code ships faster."

---

## When to Activate

- Writing any new TypeScript file
- Reviewing a PR or code change
- Refactoring existing code
- Onboarding to a new area of the codebase

---

## TypeScript Rules

### Strictness
```json
// tsconfig.json — always use strict mode
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Type Rules
```typescript
// ✅ Always explicitly type function parameters and return types
function getProductById(id: number): Promise<Product | null> { ... }

// ✅ Use interfaces for object shapes
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

// ✅ Use type aliases for unions and intersections
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

// ❌ Never use `any` — use `unknown` if type is uncertain, then narrow
const data: any = response.data; // WRONG

// ✅ Use unknown + type guard
const data: unknown = response.data;
if (isProduct(data)) { /* now typed as Product */ }

// ❌ Never use non-null assertions without a comment explaining why
const user = getUser()!; // WRONG without justification

// ✅ Use early return to narrow types
const user = getUser();
if (!user) return null;
// user is now narrowed — safe to use
```

---

## Naming Conventions

### Files
```
# React Native components — PascalCase
MobileAppUI/app/(tabs)/CartScreen.tsx
MobileAppUI/components/QuantitySelector.tsx

# Utility files — camelCase
MobileAppUI/utils/dateUtils.ts
MobileAppUI/services/api.ts

# Backend controllers — camelCase
backend/src/controllers/product/getProduct.ts

# Backend routes — camelCase
backend/src/routes/productRoutes.ts
```

### Variables and Functions
```typescript
// ✅ camelCase for variables and functions
const productList = [];
function handleAddToCart() {}
const isLoading = true;

// ✅ PascalCase for components, classes, and types
function ProductCard({ product }: { product: Product }) {}
class AuthService {}
interface CartItem {}

// ✅ SCREAMING_SNAKE_CASE for constants
const API_BASE_URL = process.env.API_BASE_URL;
const MAX_CART_QUANTITY = 99;

// ✅ Prefix booleans with is/has/can/should
const isAuthenticated = true;
const hasCartItems = cartItems.length > 0;
const canPlaceOrder = !isLoading && hasCartItems;
```

### React Native Components
```typescript
// ✅ Component file exports a single default component matching filename
// File: ProductCard.tsx
export default function ProductCard({ product }: ProductCardProps) {}

// ✅ Props interface named [ComponentName]Props
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

// ✅ Hooks follow use* convention
function useCartItems() {}
function useProductSearch(query: string) {}
```

---

## Import Ordering

Always order imports in this sequence:
```typescript
// 1. React / React Native core
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// 2. Expo packages
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// 3. Third-party libraries
import axios from 'axios';

// 4. Internal services and utils
import { apiService } from '@/services/api';
import { formatDate } from '@/utils/dateUtils';

// 5. Internal components
import QuantitySelector from '@/components/QuantitySelector';

// 6. Types and interfaces
import type { Product, CartItem } from '@/interfaces/interfaces';

// Blank line between each group
```

---

## React Native Component Structure

```typescript
// Standard component structure
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Types defined at top
interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

// Component function — NOT arrow function at top level
export default function ProductCard({ product, onPress }: ProductCardProps) {
  // 1. Hooks
  const [isLoading, setIsLoading] = useState(false);
  
  // 2. Derived state / computed values
  const isInStock = product.stock > 0;
  
  // 3. Callbacks (use useCallback for functions passed as props)
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);
  
  // 4. Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 5. Early returns (loading, error, empty states)
  if (isLoading) return <LoadingSpinner />;
  
  // 6. Main render
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{product.name}</Text>
    </View>
  );
}

// Styles at bottom
const styles = StyleSheet.create({
  container: { flex: 1 },
  name: { fontSize: 16 },
});
```

---

## Backend API Controller Structure

```typescript
// Standard controller function
import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export async function getProductById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Extract and validate params
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    // 2. Query database
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    // 3. Handle not found
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // 4. Return success
    res.json({ data: product });
  } catch (error) {
    next(error); // Pass to centralized error handler
  }
}
```

---

## Error Handling Rules

```typescript
// ✅ Always handle errors explicitly
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  // Log and re-throw or handle
  console.error('[ServiceName] Operation failed:', error);
  throw error;
}

// ✅ Never silently swallow errors
try {
  const result = await someAsyncOperation();
} catch (error) {
  // ❌ Empty catch — NEVER do this
}

// ✅ Use type-safe error handling
if (error instanceof Error) {
  console.error(error.message);
} else {
  console.error('Unknown error:', error);
}
```

---

## Rules Never to Break

1. **No `any` type** — use `unknown` with type guards
2. **No empty catch blocks** — always log or handle
3. **No hardcoded URLs or API keys** — always use env vars
4. **No `console.log` in production code** — use structured logging in backend
5. **No direct database calls in controllers** — use service layer
6. **No business logic in React components** — extract to hooks or services
7. **No `eslint-disable` without a comment** — explain why it's necessary

---

## Verification Checklist

- [ ] TypeScript compiles with zero errors (`tsc --noEmit`)
- [ ] No `any` types used
- [ ] All functions have typed parameters and return types
- [ ] Naming conventions followed (files, variables, components)
- [ ] Imports ordered correctly
- [ ] Component structure follows standard layout
- [ ] No hardcoded secrets or API keys
- [ ] Error handling is explicit (no empty catch blocks)
- [ ] ESLint passes with zero warnings
