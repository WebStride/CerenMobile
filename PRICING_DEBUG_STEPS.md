# Pricing Debug Steps - Follow These EXACTLY

## Problem Summary
- **Expected**: When user has NO store → prices should be HIDDEN
- **Actual**: Prices are still showing

## Root Cause Analysis

The issue is that **AsyncStorage might have stale data** from previous sessions where a store was selected. We need to ensure it's properly cleared.

## IMMEDIATE FIX - Run These Commands

### Step 1: Clear AsyncStorage Completely
Add this code **temporarily** to your `SelectStore.tsx` useEffect:

```typescript
useEffect(() => {
  let mounted = true;
  const load = async () => {
    // ADD THIS DEBUG CODE
    console.log('🧹 CLEARING ALL STORAGE FOR DEBUG');
    await AsyncStorage.removeItem('selectedStoreId');
    await AsyncStorage.removeItem('selectedStoreName');
    const check = await AsyncStorage.getItem('selectedStoreId');
    console.log('✅ After clear, selectedStoreId is:', check); // Should be null
    // END DEBUG CODE
    
    console.log('🏪 [SelectStore] Loading stores...');
    setLoading(true);
    const res = await getStoresForUser();
    // ... rest of code
  };
  load();
}, []);
```

### Step 2: Test the Flow

1. **Kill the app completely** (don't just reload)
2. **Restart the app fresh**
3. **Login as a user with NO stores**
4. Watch the console logs - you should see:
   ```
   🧹 CLEARING ALL STORAGE FOR DEBUG
   ✅ After clear, selectedStoreId is: null
   🏪 [SelectStore] Loading stores...
   🏪 [SelectStore] API Response: { success: true, stores: [] }
   🏪 [SelectStore] Found 0 stores
   ⚠️ [SelectStore] NO STORES - Will show "Continue to Browse" button
   ```

5. **Click "Continue to Browse" button**
6. On the shop screen, check logs:
   ```
   🔑 [getSelectedStoreId] Retrieved: null → Returning: null
   📦 [getBestSelling] Selected Store ID: null
   📦 [getBestSelling] CustomerId in headers: NONE
   ```

7. **Backend should respond with**:
   ```
   showPricing: false
   customerId: null
   ```

8. **Prices should show as**: "Price on request"

## Step 3: Check Backend Logs

In your backend terminal, you should see:
```
[getCustomerPricingInfo] userId: 123, selectedCustomerId: null
[getCustomerPricingInfo] No customer found - catalog mode (no pricing)
```

## Step 4: Verify Price Display

In the shop screen, products should render like this:
```
Product Name
Price on request  ← NOT ₹123.00
```

## If Prices STILL Show After Above Steps

### Check 1: Verify API Response
Add this to your shop.tsx where you fetch products:

```typescript
const fetchProducts = async () => {
  const data = await getBestSelling(50);
  console.log('🔍 SHOP - API Response:', JSON.stringify(data, null, 2));
  console.log('🔍 SHOP - showPricing flag:', data.showPricing);
  console.log('🔍 SHOP - First product:', data.products?.[0]);
  // ... rest of code
};
```

### Check 2: Verify Backend is Receiving null customerId

In `backend/src/controllers/product/index.ts`, the logs should show:
```
[getBestSellingProductsList] userId: 123, selectedCustomerId: null
[getCustomerPricingInfo] userId: 123, selectedCustomerId: null
[getCustomerPricingInfo] No customer found - catalog mode (no pricing)
```

If `selectedCustomerId` is NOT null, then the mobile app is still sending it.

### Check 3: Verify Backend is Returning null Prices

In `backend/src/service/product/index.ts`, when `showPricing = false`, products should have:
```json
{
  "ProductName": "Test Product",
  "price": null,  ← Should be null
  "mrp": null,
  "discount": null
}
```

## Permanent Fix (After Testing)

Once you confirm the flow works:

1. **Remove the debug clear code** from SelectStore.tsx
2. **Keep the enhanced logging** for future debugging
3. **The actual fix was already implemented** - we just needed to clear stale AsyncStorage

## Summary of Changes Made

### Mobile App (`MobileAppUI/`)
✅ Enhanced logging in `SelectStore.tsx`
✅ Enhanced logging in `api.ts` for `getSelectedStoreId()`
✅ Enhanced logging in `getBestSelling()` API call
✅ Price display logic in `shop.tsx` (already correct)

### Backend (`backend/`)
✅ `getCustomerPricingInfo()` - Returns `showPricing: false` when no customerId
✅ Controllers extract customerId from query/header
✅ Services respect `showPricing` flag

## Testing Checklist

- [ ] Clear AsyncStorage on app start
- [ ] Login as user with NO stores
- [ ] See "Continue to Browse" button (not "Select Store")
- [ ] Click "Continue to Browse"
- [ ] Verify logs show `selectedStoreId: null`
- [ ] Verify backend logs show `selectedCustomerId: null`
- [ ] Verify backend logs show `showPricing: false`
- [ ] Verify products show "Price on request"
- [ ] Verify Add to Cart button is disabled or shows "Contact for Price"

## Contact Me If...

- Prices still show after following ALL steps above
- "Continue to Browse" button doesn't appear
- Backend logs show `selectedCustomerId` is NOT null
- Share the complete console logs from both mobile and backend
