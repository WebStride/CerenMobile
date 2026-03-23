---
name: mobile-feature-ship
description: 'Universal Senior Architect quality gate for any mobile app feature. Use AFTER every feature is built — before pushing or merging. Works with any mobile stack (React Native, Flutter, Ionic, Native iOS/Android) and any backend (Node.js, Django, Rails, Firebase, Supabase, Spring, etc.). Catches: slow API calls / form submits, missing loading states, duplicate fetches, no error handling, N+1 backend queries, large unoptimized payloads, insecure token usage, unoptimized lists. Runs 8 phases: API Audit → UX Feedback → Error Handling → Performance → Security → Backend Query Audit → Code Quality → Ship Checklist.'
argument-hint: 'Which feature, screen, or stack? (e.g. "place order screen in React Native", "product list in Flutter", "login form in Swift")'
---

# Mobile Feature Ship — Universal Quality Gate

**Applies to:** Any mobile app stack (React Native · Flutter · Ionic · Native iOS/Android) with any backend (Node.js · Django · Rails · Firebase · Supabase · Spring)

**Trigger:** Run this skill on **every feature** before pushing/merging — especially any screen with a form submit, data fetch, or API call.

> **Root causes of slow submits / fetches this skill fixes:**
> - No loading/disabled state → user taps button multiple times → duplicate API calls
> - Sequential async chains that could run in parallel
> - No caching → full re-fetch on every screen visit / tab switch
> - Oversized JSON responses with 50+ fields when only 5 are needed
> - N+1 database queries (fetching related records in a loop)
> - No debounce on search / text inputs
> - Images not cached or lazy-loaded
> - No optimistic UI → app feels slow even when the API is fast

---

## Phase 1 — API Call Audit

**Goal:** Every API call is necessary, minimal, and non-duplicated.

### 1.1 — Identify all API calls in the feature

Open the screen/widget file and list every network call made:

```bash
# React Native / JS / TS
grep -n "await \|fetch(\|axios\.\|useQuery\|useSWR\|http\.get" <ScreenFile>.tsx

# Flutter / Dart
grep -n "http\.get\|dio\.get\|await.*service\|FutureBuilder\|StreamBuilder" <screen>.dart

# Swift
grep -n "URLSession\|dataTask\|async let\|await.*service" <ViewController>.swift

# Kotlin
grep -n "suspend fun\|launch\|viewModelScope\|retrofit\|okhttp" <ViewModel>.kt
```

For each call, answer:
- [ ] Is this call triggered more than once for the same data? (duplicate calls)
- [ ] Is it called inside a lifecycle hook with no guard (re-runs on every render/rebuild)?
- [ ] Are multiple **independent** calls made sequentially instead of in parallel?
- [ ] Is the same call made in both a parent and a child component?

### 1.2 — Fix sequential calls → parallel

**Bad (slow — waits for each one):**
```typescript
// React Native / TypeScript
const products = await getProducts();   // 300ms
const cart     = await getCart();       // 200ms
const profile  = await getProfile();   // 150ms
// Total: ~650ms
```

**Good (fast — all fire at once):**
```typescript
// React Native / TypeScript
const [products, cart, profile] = await Promise.all([
  getProducts(),
  getCart(),
  getProfile(),
]);
// Total: ~300ms (slowest of the three)
```

```dart
// Flutter
final results = await Future.wait([
  productService.getProducts(),
  cartService.getCart(),
  profileService.getProfile(),
]);
```

```kotlin
// Android — Kotlin coroutines
val (products, cart) = awaitAll(
  async { productRepo.getProducts() },
  async { cartRepo.getCart() },
)
```

```swift
// iOS — Swift concurrency
async let products = productService.fetchProducts()
async let cart     = cartService.fetchCart()
let (p, c) = try await (products, cart)
```

### 1.3 — Prevent duplicate submit calls

**Bad (user double-taps → duplicate action):**
```typescript
// React Native
<TouchableOpacity onPress={handleSubmit}>
  <Text>Submit</Text>
</TouchableOpacity>
```

**Good — React Native:**
```typescript
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async () => {
  if (submitting) return; // early guard
  setSubmitting(true);
  try {
    await submitAction(payload);
  } finally {
    setSubmitting(false);
  }
};

<TouchableOpacity
  onPress={handleSubmit}
  disabled={submitting}
  style={{ opacity: submitting ? 0.6 : 1 }}
>
  {submitting
    ? <ActivityIndicator color="#fff" size="small" />
    : <Text>Submit</Text>}
</TouchableOpacity>
```

**Good — Flutter:**
```dart
bool _submitting = false;

Future<void> _handleSubmit() async {
  if (_submitting) return;
  setState(() => _submitting = true);
  try {
    await service.submit(payload);
  } finally {
    if (mounted) setState(() => _submitting = false);
  }
}

ElevatedButton(
  onPressed: _submitting ? null : _handleSubmit,
  child: _submitting
    ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
    : const Text('Submit'),
)
```

**Good — SwiftUI:**
```swift
@State private var submitting = false

Button(action: handleSubmit) {
  if submitting {
    ProgressView().tint(.white)
  } else {
    Text("Submit")
  }
}
.disabled(submitting)
```

**Checklist:**
- [ ] All form submit buttons are `disabled` while the API call is in-flight
- [ ] No sequential `await` chains for independent data fetches — use parallel fetch
- [ ] No lifecycle hooks without guards calling an API on every render/rebuild
- [ ] No API call duplicated in parent and child for the same data

---

## Phase 2 — UX Feedback (Loading States)

**Goal:** The user always knows something is happening within 100ms of any action.

### 2.1 — Initial screen load

Every screen that fetches data on mount must show a loading indicator:

```typescript
// React Native
if (loading) {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text>Loading...</Text>
    </SafeAreaView>
  );
}
```

```dart
// Flutter
if (_loading) {
  return const Scaffold(
    body: Center(child: CircularProgressIndicator()),
  );
}
```

```swift
// SwiftUI
if viewModel.isLoading {
  ProgressView("Loading...")
    .frame(maxWidth: .infinity, maxHeight: .infinity)
}
```

### 2.2 — Skeleton screens (preferred over spinners for lists)

For any content list — show skeleton placeholder cards while loading. This gives users a structural preview and feels faster:

```typescript
// React Native — simple skeleton
const SkeletonCard = () => (
  <View style={{ backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16, marginBottom: 12 }}>
    <View style={{ backgroundColor: '#e5e7eb', height: 128, borderRadius: 8, marginBottom: 8 }} />
    <View style={{ backgroundColor: '#e5e7eb', height: 16, borderRadius: 4, width: '75%', marginBottom: 4 }} />
    <View style={{ backgroundColor: '#e5e7eb', height: 16, borderRadius: 4, width: '50%' }} />
  </View>
);
// Animated alternative: react-native-skeleton-placeholder | expo-skeleton | shimmer-placeholder
```

```dart
// Flutter — shimmer package
Shimmer.fromColors(
  baseColor: Colors.grey[300]!,
  highlightColor: Colors.grey[100]!,
  child: ItemCardPlaceholder(),
);
```

### 2.3 — Inline button loading (forms / actions)

For any submit, save, add, or delete button:
- Replace button label with a spinner while the call is in-flight
- Disable the button until the call fully resolves
- Apply visual dimming/opacity as secondary feedback

### 2.4 — Pull-to-refresh

All list screens should support pull-to-refresh:

```typescript
// React Native
const [refreshing, setRefreshing] = useState(false);
const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadData();
  setRefreshing(false);
}, []);

<FlatList
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
/>
```

```dart
// Flutter
RefreshIndicator(
  onRefresh: _loadData,
  child: ListView.builder(...),
)
```

### 2.5 — Empty and error states

Never show a blank screen. Always explicitly handle both states:

```typescript
// React Native — empty state
if (!loading && items.length === 0) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>No items found.</Text>
      <Button title="Retry" onPress={loadData} />
    </View>
  );
}
```

**Checklist:**
- [ ] Initial load shows a spinner or skeleton
- [ ] Form submit buttons show spinner and are disabled while loading
- [ ] List screens have pull-to-refresh
- [ ] Empty state is handled with a friendly message + optional retry button
- [ ] Error state is handled with a retry button (not a blank screen)

---

## Phase 3 — Error Handling

**Goal:** No silent failures. Every failure is visible to the user or logged for debugging.

### 3.1 — API response validation

Always validate the response before using data. Never assume the call succeeded:

```typescript
// React Native / JS — REST API with success flag
const res = await fetchOrders();
if (!res || !res.success) {
  Alert.alert('Error', res?.message || 'Failed to load. Please try again.');
  return;
}
// safe to use res.data
```

```dart
// Flutter — exception-based
try {
  final orders = await orderRepository.fetchOrders();
  setState(() => _orders = orders);
} on AppException catch (e) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(e.message)),
  );
} catch (e) {
  debugPrint('[fetchOrders] $e');
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(content: Text('Something went wrong. Please try again.')),
  );
}
```

### 3.2 — Network / offline handling

Detect connectivity before critical calls — never let the app silently hang:

```typescript
// React Native
import NetInfo from '@react-native-community/netinfo';

const checkAndFetch = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    Alert.alert('No Internet', 'Please check your connection and try again.');
    return;
  }
  await loadData();
};
```

```dart
// Flutter — connectivity_plus package
final connectivity = await Connectivity().checkConnectivity();
if (connectivity == ConnectivityResult.none) {
  _showNoInternetDialog();
  return;
}
```

### 3.3 — Try-catch-finally on every user action

Never let exceptions escape a user-triggered action silently:

```typescript
// React Native / JS
const handleSubmit = async () => {
  setSubmitting(true);
  try {
    const result = await submitAction(payload);
    if (result.success) {
      navigateTo('SuccessScreen');
    } else {
      Alert.alert('Failed', result.message || 'Please try again.');
    }
  } catch (err) {
    console.error('[handleSubmit]', err);
    Alert.alert('Something went wrong', 'Please try again later.');
  } finally {
    setSubmitting(false);
  }
};
```

```dart
// Flutter
Future<void> _handleSubmit() async {
  setState(() => _submitting = true);
  try {
    await service.submit(payload);
    Navigator.pushReplacementNamed(context, '/success');
  } catch (e) {
    debugPrint('[handleSubmit] $e');
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Something went wrong. Please try again.')),
    );
  } finally {
    if (mounted) setState(() => _submitting = false);
  }
}
```

```swift
// SwiftUI
func handleSubmit() async {
  isSubmitting = true
  defer { isSubmitting = false }
  do {
    try await service.submit(payload)
    navigateToSuccess()
  } catch {
    errorMessage = error.localizedDescription
    showError = true
  }
}
```

### 3.4 — Auth / token expiry handling

For any app using JWT or session tokens:
- Does the app redirect to login when the token expires?
- Does the user ever get stuck on a blank screen instead of seeing a login prompt?
- Is silent token refresh implemented to avoid unnecessary logouts?

**Checklist:**
- [ ] All API responses are validated before using data
- [ ] All async user-triggered actions have try-catch-finally
- [ ] Network offline/disconnected state is handled with a user-visible message
- [ ] Auth token expiry shows login screen, not a white/blank screen
- [ ] Errors are logged (`console.error` / `debugPrint`) AND surfaced to the user for UI-critical failures

---

## Phase 4 — Performance Optimization

**Goal:** Smooth 60fps scrolling, no unnecessary re-renders, images load fast.

### 4.1 — List optimizations (required for any scrollable list)

```typescript
// React Native — FlatList
<FlatList
  data={items}
  keyExtractor={(item) => String(item.id)}
  renderItem={renderItem}          // define outside JSX, or wrap in useCallback
  initialNumToRender={10}          // don't render all 200 items at startup
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}     // unmount off-screen items (Android)
  getItemLayout={(_, index) => ({  // only if item height is fixed — huge perf win
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

```dart
// Flutter — ListView.builder (lazy by default)
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ItemCard(item: items[index]),
  itemExtent: ITEM_HEIGHT, // fixed height equivalent of getItemLayout
);
// Large lists: use const constructors in ItemCard to avoid rebuilds
```

```swift
// SwiftUI — LazyVStack / List is lazy by default
List(items) { item in
  ItemRow(item: item)
}
// For custom layouts: use LazyVStack inside ScrollView
```

### 4.2 — Prevent unnecessary re-renders

```typescript
// React Native — memoize list items and callbacks
const ItemCard = React.memo(({ item, onPress }: Props) => {
  return <TouchableOpacity onPress={() => onPress(item)}>...</TouchableOpacity>;
});

const handlePress = useCallback((item: Item) => {
  navigate('Detail', { id: item.id });
}, [navigate]);
```

```dart
// Flutter — use const constructors wherever possible
const ItemCard({ super.key, required this.item }); // enables widget caching
// Use RepaintBoundary around independently animated sections
RepaintBoundary(child: AnimatedCounter(value: count))
```

### 4.3 — Avoid re-fetching on every screen focus

**Bad — fetches on every tab switch:**
```typescript
// React Native
useFocusEffect(useCallback(() => {
  loadData(); // fires EVERY time the screen gains focus
}, []));
```

**Good — load once, refresh only when needed:**
```typescript
const hasLoaded = useRef(false);
useFocusEffect(useCallback(() => {
  if (!hasLoaded.current) {
    loadData();
    hasLoaded.current = true;
  }
}, []));
```

```dart
// Flutter — keep tab state alive with AutomaticKeepAliveClientMixin
class _TabScreenState extends State<TabScreen> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true; // preserves state across tab switches
}
```

### 4.4 — Pagination (required for lists > 20 items)

Never fetch all records in one call. Use page/offset pagination:

```typescript
// React Native frontend
const PAGE_SIZE = 20;
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  if (loadingMore || !hasMore) return;
  setLoadingMore(true);
  const res = await fetchItems({ page: page + 1, limit: PAGE_SIZE });
  if (res.success) {
    setItems(prev => [...prev, ...res.data]);
    setHasMore(res.data.length === PAGE_SIZE);
    setPage(p => p + 1);
  }
  setLoadingMore(false);
};
```

```typescript
// Node.js + Prisma backend
const items = await prisma.item.findMany({
  skip: (page - 1) * limit,
  take: limit,
  select: { id: true, name: true, imageUrl: true }, // only fields the UI renders
});
```

```python
# Django backend
from django.core.paginator import Paginator
paginator = Paginator(queryset.order_by('-created_at'), 20)
page_obj = paginator.get_page(request.GET.get('page', 1))
```

```dart
// Flutter — infinite scroll with ScrollController
_scrollController.addListener(() {
  if (_scrollController.position.pixels >=
      _scrollController.position.maxScrollExtent - 200) {
    _loadMore();
  }
});
```

### 4.5 — Debounce search inputs

```typescript
// React Native / JS — manual debounce
const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleSearch = (text: string) => {
  setQuery(text);
  if (searchRef.current) clearTimeout(searchRef.current);
  searchRef.current = setTimeout(() => {
    fetchResults(text); // API call fires only after 400ms of inactivity
  }, 400);
};
// Alternatively: lodash.debounce or useDebouncedValue custom hook
```

```dart
// Flutter
Timer? _debounce;
void _onSearchChanged(String query) {
  if (_debounce?.isActive ?? false) _debounce!.cancel();
  _debounce = Timer(const Duration(milliseconds: 400), () {
    _fetchResults(query);
  });
}
```

**Checklist:**
- [ ] All scrollable lists have `initialNumToRender` / lazy loading / `itemExtent`
- [ ] List item components are memoized (React.memo / const constructors)
- [ ] Callbacks passed to list items are stable (useCallback / not recreated per render)
- [ ] Lists with > 20 items use pagination with infinite scroll or paged navigation
- [ ] Search inputs are debounced (≥ 300ms)
- [ ] Screen data is not re-fetched on every focus unless genuinely stale
- [ ] `getItemLayout` / `itemExtent` used where item height is fixed

---

## Phase 5 — Security Validation

**Goal:** No tokens or sensitive data leaked. No injection vectors. No unauthorized access.

### 5.1 — No secrets or PII in log statements

Scan all logging calls in the feature:

```bash
# React Native / JS / TS
grep -rn "console\.log\|console\.error" <ScreenFile>.tsx

# Flutter / Dart
grep -rn "print(\|debugPrint(" <screen>.dart

# Swift
grep -rn "print(\|NSLog(" <ViewController>.swift

# Kotlin / Java
grep -rn "Log\.d\|Log\.e\|println(" <Activity>.kt
```

Ensure none of the logged values contain:
- Access tokens, refresh tokens, or API keys
- User passwords or OTP/PIN codes
- Full API response objects that may contain PII
- Payment card details or financial/health data

### 5.2 — User input sanitization before API calls

Validate and trim all user input client-side before sending to the backend:

```typescript
// React Native / JS
const name = inputName.trim();
if (!name || name.length < 2) {
  Alert.alert('Validation', 'Name must be at least 2 characters.');
  return;
}
```

```dart
// Flutter — Form + validator
TextFormField(
  validator: (value) {
    if (value == null || value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return null;
  },
)
// Always call _formKey.currentState!.validate() before submit
```

> **Important:** Client-side validation is for UX only. **Always validate again on the server.** Never rely solely on client validation.

### 5.3 — Secure token and credential storage

Authentication tokens must be stored in the platform's secure storage. **Never store tokens in plain key-value stores.**

| Platform | Secure storage | Avoid for tokens |
|---|---|---|
| React Native | `expo-secure-store` / `react-native-keychain` | Plain `AsyncStorage` |
| Flutter | `flutter_secure_storage` | Plain `SharedPreferences` |
| iOS Native | Keychain | `UserDefaults` |
| Android Native | `EncryptedSharedPreferences` / Android Keystore | Plain `SharedPreferences` |

- Tokens must be cleared on logout
- Tokens must be sent in HTTP `Authorization` headers — never in URL query parameters

### 5.4 — Authorization on backend routes

For every new backend route added with this feature:

- [ ] Route has authentication middleware (JWT verify, session check, etc.)
- [ ] Route validates the requesting user owns the resource (no IDOR vulnerability)
- [ ] No raw SQL string concatenation — use parameterized queries or ORM only

**IDOR prevention pattern:**

```typescript
// Node.js — bad: no ownership check
router.get('/orders/:id', authMiddleware, async (req, res) => {
  const order = await db.order.findById(req.params.id); // ❌ any user can access any order
  res.json(order);
});

// Node.js + Prisma — good: ownership enforced in query
router.get('/orders/:id', authMiddleware, async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: Number(req.params.id), userId: req.user.id }, // ✅ must belong to caller
  });
  if (!order) return res.status(404).json({ message: 'Not found' });
  res.json(order);
});
```

```python
# Django — scoped queryset prevents IDOR automatically
order = get_object_or_404(Order, pk=order_id, user=request.user)
```

```ruby
# Rails — scoped to current_user
@order = current_user.orders.find(params[:id])
```

**Checklist:**
- [ ] No tokens or PII in log statements
- [ ] All text inputs trimmed + validated before API call
- [ ] New backend routes have authentication middleware
- [ ] Backend verifies resource ownership (no IDOR)
- [ ] No raw SQL string concatenation — ORM / parameterized queries only
- [ ] Logout clears all tokens from secure storage

---

## Phase 6 — Backend Query Audit

**Goal:** Every database query runs in < 100ms under normal load.

### 6.1 — N+1 query detection

Queries inside a loop are the #1 backend performance killer. Always eager-load related data:

**Bad (N+1):**
```typescript
// Node.js + Prisma
const orders = await prisma.order.findMany({ where: { userId } });
for (const order of orders) {
  order.items = await prisma.orderItem.findMany({ where: { orderId: order.id } }); // ❌ 1 query per order
}
```

**Good (eager-load in one round trip):**
```typescript
// Prisma
const orders = await prisma.order.findMany({
  where: { userId },
  include: { items: { include: { product: { select: { name: true, imageUrl: true } } } } },
});
```

```python
# Django — prefetch_related = 1 extra query for all related rows
orders = Order.objects.filter(user=user).prefetch_related('items__product')
# select_related for FK/OneToOne (JOIN)
orders = Order.objects.select_related('customer').filter(user=user)
```

```ruby
# Rails
orders = Order.includes(items: :product).where(user: current_user)
```

```java
// Spring JPA — JPQL with JOIN FETCH
@Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.user = :user")
List<Order> findWithItems(@Param("user") User user);
```

### 6.2 — Select only needed fields

Never fetch the full row — return only what the mobile UI renders:

```typescript
// Prisma
const items = await prisma.product.findMany({
  where: { categoryId },
  select: { id: true, name: true, price: true, imageUrl: true }, // ✅ minimal
});
```

```python
# Django
Product.objects.filter(category_id=cat_id).values('id', 'name', 'price', 'image_url')
```

```ruby
# Rails
Product.where(category: cat).select(:id, :name, :price, :image_url)
```

```typescript
// Firestore — field mask
db.collection('products').select('name', 'price', 'imageUrl').get()
```

### 6.3 — Indexes on all filter columns

Every column used in a `WHERE` / `filter` clause (that is not a primary key) needs a database index:

```sql
-- Check index usage on any DB
EXPLAIN SELECT * FROM orders WHERE user_id = 1;

-- Add missing indexes
CREATE INDEX idx_orders_user_id      ON orders(user_id);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);
```

```prisma
// Prisma schema — declare indexes
model Order {
  id        Int      @id @default(autoincrement())
  userId    Int
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([userId, createdAt])
}
```

### 6.4 — Response size

```bash
# Verify list endpoint response size
curl -sI https://api.example.com/products | grep -i content-length
# or check the Network tab body size in Postman / Insomnia
# Target: < 100KB per list response
# If > 100KB: add pagination + field projection
```

### 6.5 — Always sort list queries

Without explicit ordering, DB results are non-deterministic — users see different orders on refresh:

```typescript
// Prisma
const items = await prisma.item.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
```

```python
# Django
Item.objects.filter(user=user).order_by('-created_at')[:20]
```

```sql
SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC LIMIT 20;
```

**Checklist:**
- [ ] No DB calls inside `for` loops — use eager loading (`include` / `prefetch_related` / `JOIN FETCH`)
- [ ] All queries select only the fields the UI renders
- [ ] All `WHERE` filter columns have DB indexes
- [ ] List endpoints are paginated (`LIMIT` / `take`) — no unbounded `SELECT *`
- [ ] All list queries have explicit `ORDER BY`
- [ ] Any schema changes have a migration script committed

---

## Phase 7 — Code Quality

**Goal:** Feature code is maintainable, typed, and doesn't introduce tech debt.

### 7.1 — File / widget size

If a screen file exceeds ~300 lines, extract sub-components into their own files:
- Card/item → `components/<Feature>Card.{tsx|dart|swift|kt}`
- Modal/dialog → `components/<Feature>Modal.{tsx|dart|swift|kt}`
- List item → separate widget / view

### 7.2 — Strong typing — no loosely typed values

```typescript
// React Native / TypeScript — no `any`
// Bad
const handleResponse = (data: any) => { ... }

// Good — define a typed interface
interface OrderResponse {
  success: boolean;
  orders: Order[];
}
const handleResponse = (data: OrderResponse) => { ... }
```

```dart
// Flutter — avoid `dynamic`; use typed models
// Bad
Map<String, dynamic> raw = response.data;
String name = raw['name']; // runtime error if key missing

// Good — typed model class
final order = Order.fromJson(response.data as Map<String, dynamic>);
```

```swift
// Swift — use Codable structs over raw Dictionary
struct Order: Codable {
  let id: Int
  let name: String
}
let order = try JSONDecoder().decode(Order.self, from: data)
```

### 7.3 — No hardcoded magic values

```typescript
// React Native / JS — no magic strings, numbers, or color literals
// Bad
const size = 20;
const color = '#ff5733';

// Good — extract to a constants or theme file
import { AppConstants, AppColors } from '@/constants';
const size = AppConstants.PAGE_SIZE;
const color = AppColors.primary;
```

```dart
// Flutter — use theme or app-level constants
// Bad
Container(color: const Color(0xFF16A34A))
// Good
Container(color: Theme.of(context).colorScheme.primary)
// or: AppColors.primary (from a constants file)
```

### 7.4 — Cleanup on unmount / dispose

Cancel async operations when the screen is destroyed to avoid memory leaks and setState-on-unmounted-component errors:

```typescript
// React Native — isMounted flag
useEffect(() => {
  let isMounted = true;
  const load = async () => {
    const data = await fetchData();
    if (isMounted) setItems(data); // guard: skip if already unmounted
  };
  load();
  return () => { isMounted = false; };
}, []);

// React Native — AbortController (preferred for fetch calls)
useEffect(() => {
  const controller = new AbortController();
  fetchData({ signal: controller.signal }).then(setItems).catch(() => {});
  return () => controller.abort();
}, []);
```

```dart
// Flutter — dispose all controllers, timers, and stream subscriptions
@override
void dispose() {
  _scrollController.dispose();
  _textController.dispose();
  _debounceTimer?.cancel();
  _subscription?.cancel();
  super.dispose();
}
```

```swift
// SwiftUI — .task modifier auto-cancels on view disappear
.task {
  await loadData()
}
// UIKit — cancel Combine subscriptions in deinit or viewWillDisappear
```

**Checklist:**
- [ ] Screen/widget file < 300 lines (extract components if larger)
- [ ] No `any` / `dynamic` types in new code — use typed models
- [ ] No hardcoded colors, magic numbers, or string literals (use constants / theme)
- [ ] Async effects have unmount / dispose cleanup
- [ ] All new components have typed props / constructor parameters
- [ ] No unused imports or dead code

---

## Phase 8 — Final Ship Checklist

Run through this before every PR / push.

### Pre-merge static checks

```bash
# React Native / Expo (TypeScript)
npx tsc --noEmit                         # TypeScript errors?
npx eslint . --ext .ts,.tsx              # Lint errors?

# Node.js backend (TypeScript + Prisma)
npx tsc --noEmit
npx prisma validate                      # Schema valid?
npx prisma migrate status                # Pending migrations applied?

# Flutter
flutter analyze                          # Dart analysis
flutter test                             # Unit tests

# iOS / Swift
swiftlint                                # Lint (if installed)

# Android / Kotlin
./gradlew lint
./gradlew test
```

### Manual smoke test on a real device

> **Do not rely solely on simulator/emulator — always test on a physical device.**

1. **Slow network** — Enable "Slow 3G" in Android Developer Options / Network Link Conditioner on iOS → Loading states appear correctly?
2. **Airplane mode mid-fetch** — Toggle airplane mode while a fetch is in-flight → App handles disconnect gracefully with a user message?
3. **Double-tap submit** — Tap the submit button twice rapidly → Only 1 API call made?
4. **Back navigation mid-submit** — Navigate away while a submit is in-flight → No crash or memory leak?
5. **Empty state** — Does the screen show a friendly message with 0 results (not a blank screen)?
6. **Error state** — Disable the backend / use a wrong host → Does the app show a friendly error (not a crash)?
7. **Token expiry** — Does the app handle expired auth tokens with a login redirect?

### Performance benchmarks

| Metric | Target | How to measure |
|---|---|---|
| List screen initial load | < 1.5s on 4G | Flipper / Android Profiler / Xcode Instruments |
| Form submit round-trip | < 2s on 4G | Network tab in Flipper / Charles Proxy / browser DevTools |
| Scroll FPS on list | 60fps (120fps on ProMotion) | Android GPU Rendering bars / Xcode Instruments |
| API response size (list endpoint) | < 100KB | Postman / curl Content-Length |
| App start to interactive | < 3s cold start, < 1s warm | React Native Perf Monitor / Flutter DevTools |

### Final pre-ship checklist

- [ ] Phase 1 (API Audit) — all items green
- [ ] Phase 2 (UX Feedback) — all items green
- [ ] Phase 3 (Error Handling) — all items green
- [ ] Phase 4 (Performance) — all items green
- [ ] Phase 5 (Security) — all items green
- [ ] Phase 6 (Backend Query Audit) — all items green
- [ ] Phase 7 (Code Quality) — all items green
- [ ] No debug log statements (`console.log` / `print` / `Log.d`) left in the PR
- [ ] No `TODO` / `FIXME` / `HACK` comments introduced without a tracking issue
- [ ] Feature tested on a real device with slow network simulation
- [ ] Double-tap submit tested
- [ ] Back navigation mid-submit tested
- [ ] Empty and error states verified visually on device
- [ ] PR description explains what the feature does and how to manually test it

---

## Quick Reference — Common Fixes

| Symptom | Phase | Fix |
|---|---|---|
| Submit calls API twice | 1 + 2 | Add `submitting` guard + disabled button/widget |
| Screen blank / white on load | 2 | Add loading spinner or skeleton |
| Screen blank on error | 3 | Add try-catch + user-visible error message |
| List lag / janky scroll | 4 | Memoize items + `getItemLayout` / `itemExtent` |
| Search hits API every keystroke | 4 | Debounce input handler (≥ 300ms) |
| Screen re-fetches on every tab switch | 4 | Add `hasLoaded` guard / `wantKeepAlive: true` |
| Backend list endpoint takes > 1s | 6 | Add field projection, `LIMIT`/`take`, DB indexes |
| Backend N+1 queries | 6 | Use eager loading (`include` / `prefetch_related` / `JOIN FETCH`) |
| Any user can access another user's data | 5 | Add ownership filter in DB query (`userId = currentUser.id`) |
| App crashes navigating back mid-fetch | 7 | Add `isMounted` guard / `AbortController` / `dispose()` |
| Token leaked in logs | 5 | Remove sensitive values from log statements |
| Form fields send unvalidated data | 5 | Add client-side trim + validation before API call |
