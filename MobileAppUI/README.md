# Ceren Mobile App - Wholesale B2B E-Commerce Platform

## 📱 Overview

Ceren Mobile is a comprehensive B2B wholesale e-commerce mobile application built for wholesalers to purchase goods directly from the production company. The app provides a seamless ordering experience with features like product browsing, cart management, order placement, invoice tracking, and real-time delivery tracking using Google Maps integration.

**Tech Stack:**
- **Frontend:** React Native, Expo, TypeScript, NativeWind (TailwindCSS)
- **Backend:** Node.js, Express, TypeScript
- **Database:** MySQL with Prisma ORM
- **Authentication:** JWT-based with MSG91 SMS OTP
- **APIs:** RESTful API architecture
- **Maps:** Google Maps API for store location and delivery tracking

---

## 🏗️ System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Mobile App Layer"
        A[React Native App]
        B[Expo Router]
        C[Context Providers]
        D[Service Layer]
    end
    
    subgraph "API Layer"
        E[Express Server]
        F[REST API Routes]
        G[Controllers]
        H[Services]
    end
    
    subgraph "Authentication"
        I[JWT Middleware]
        J[MSG91 OTP Service]
    end
    
    subgraph "Data Layer"
        K[Prisma ORM]
        L[(MySQL Database)]
    end
    
    subgraph "External Services"
        M[Google Maps API]
        N[MSG91 SMS Gateway]
    end
    
    A --> B
    B --> C
    C --> D
    D -->|HTTP/HTTPS| E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    H --> K
    K --> L
    J -.->|SMS OTP| N
    A -.->|Maps| M

    style A fill:#4CAF50
    style E fill:#2196F3
    style L fill:#FF9800
    style M fill:#F44336
    style N fill:#9C27B0
```

### Application Flow Architecture

```mermaid
graph LR
    A[User Opens App] --> B{Authenticated?}
    B -->|No| C[Login/Register Screen]
    B -->|Yes| D[Home Screen]
    
    C --> E[Enter Phone Number]
    E --> F[OTP Sent via MSG91]
    F --> G[Enter OTP]
    G --> H{OTP Valid?}
    H -->|Yes| I[Generate JWT Tokens]
    H -->|No| G
    I --> J[Link to Customer]
    J --> D
    
    D --> K[Browse Products]
    D --> L[View Cart]
    D --> M[View Orders]
    D --> N[View Invoices]
    
    K --> O[Add to Cart/Favourites]
    O --> L
    L --> P[Place Order]
    P --> Q[Order Confirmation]
    Q --> M
    
    M --> R[Track Order Status]
    N --> S[View Invoice Details]

    style C fill:#FFE082
    style D fill:#A5D6A7
    style I fill:#81C784
    style P fill:#4DD0E1
```

---

## 🗄️ Database Architecture

### Entity Relationship Diagram (Core Tables)

```mermaid
erDiagram
    USERCUSTOMERMASTER ||--o{ CUSTOMERMASTER : "links to"
    CUSTOMERMASTER ||--o{ Orders : "places"
    CUSTOMERMASTER ||--o{ Cart : "has"
    CUSTOMERMASTER ||--o{ UserFavourites : "has"
    CUSTOMERMASTER ||--o{ DeliveryAddress : "has"
    CUSTOMERMASTER ||--o{ Invoices : "receives"
    CUSTOMERMASTER ||--o{ ACCOUNTSMASTER : "has"
    
    Orders ||--o{ OrderItems : "contains"
    Orders ||--o{ Invoices : "generates"
    
    Invoices ||--o{ InvoiceItems : "contains"
    
    OrderItems }o--|| ProductMaster : "references"
    InvoiceItems }o--|| ProductMaster : "references"
    Cart }o--|| ProductMaster : "references"
    UserFavourites }o--|| ProductMaster : "references"
    
    ProductMaster }o--|| ProductCategoryForAppMaster : "belongs to"
    ProductMaster }o--|| ProductSubCategoryForAppMaster : "belongs to"
    ProductMaster }o--|| ProductInventory : "has inventory"
    ProductMaster ||--o{ ProductImages : "has"
    
    USERCUSTOMERMASTER {
        int id PK
        string name
        string phoneNumber UK
        string address
        datetime createdAt
        datetime updatedAt
    }
    
    CUSTOMERMASTER {
        int CUSTOMERID PK
        string CUSTOMERNAME
        string ADDRESS
        string PHONENO
        int CUSTOMERTYPEID
        int PRICEGROUPID
        string GSTIN
        datetime ADDEDDATE
        boolean ACTIVE
        int USERID FK
    }
    
    Orders {
        bigint OrderID PK
        string OrderNumber
        datetime OrderDate
        int CustomerID FK
        int OrderItemCount
        float EstimateOrderAmount
        string OrderStatus
        datetime DateDelivered
        datetime CreationDate
    }
    
    OrderItems {
        int OrderItemID PK
        int OrderID FK
        int ProductID FK
        float OrderQty
        float Price
        string OrderItemStatus
    }
    
    Invoices {
        int InvoiceID PK
        string InvoiceNumber
        datetime InvoiceDate
        int CustomerID FK
        bigint OrderID FK
        int InvoiceItemCount
        float GrossInvoiceAmount
        float DiscountAmount
        float NetInvoiceAmount
        string InvoiceStatus
        float BalanceAmount
        datetime CreationDate
    }
    
    InvoiceItems {
        int InvoiceItemID PK
        int InvoiceID FK
        int ProductID FK
        float SaleQty
        float Price
        float CGST
        float SGST
        float NetTotal
        float Discount
    }
    
    ProductMaster {
        int ProductID PK
        string ProductSKU
        string ProductName
        string Description
        int CategoryID FK
        int SubCategoryID FK
        float WholesalePrice
        float RetailPrice
        float Units
        string UnitsOfMeasurement
        int ProductInvID FK
        boolean Active
        int MinimumQty
    }
    
    Cart {
        int id PK
        int customerId FK
        int productId FK
        string productName
        float price
        int quantity
        datetime createdAt
    }
    
    UserFavourites {
        int id PK
        int customerId FK
        int productId FK
        string productName
        float price
        datetime addedAt
    }
    
    DeliveryAddress {
        int DeliveryAddressID PK
        int CustomerID FK
        string Name
        string PhoneNumber
        string City
        string District
        string HouseNumber
        string PinCode
        string Latitude
        string Longitude
        boolean IsDefault
    }
    
    ACCOUNTSMASTER {
        int AccountID PK
        int CustomerID FK
        float BalanceAmount
        datetime CreationDate
    }
```

### Table Relationships Summary

| Parent Table | Child Table | Relationship | Key Field |
|--------------|-------------|--------------|-----------|
| USERCUSTOMERMASTER | CUSTOMERMASTER | One-to-Many | phoneNumber → PHONENO |
| CUSTOMERMASTER | Orders | One-to-Many | CUSTOMERID → CustomerID |
| CUSTOMERMASTER | Invoices | One-to-Many | CUSTOMERID → CustomerID |
| CUSTOMERMASTER | Cart | One-to-Many | CUSTOMERID → customerId |
| Orders | OrderItems | One-to-Many | OrderID → OrderID |
| Orders | Invoices | One-to-Many | OrderID → OrderID |
| Invoices | InvoiceItems | One-to-Many | InvoiceID → InvoiceID |
| ProductMaster | OrderItems | One-to-Many | ProductID → ProductID |
| ProductMaster | InvoiceItems | One-to-Many | ProductID → ProductID |
| ProductMaster | Cart | One-to-Many | ProductID → productId |

---

## 🔐 Authentication Flow

### Authentication Architecture

```mermaid
sequenceDiagram
    participant U as User (Mobile App)
    participant F as Frontend Service
    participant A as Auth Controller
    participant M as MSG91 Service
    participant DB as Database (Prisma)
    participant J as JWT Service
    
    Note over U,J: Registration / Login Flow
    
    U->>F: Enter Phone Number
    F->>A: POST /auth/send-otp {phoneNumber}
    A->>A: Format to E.164 (+91XXXXXXXXXX)
    A->>M: Send OTP via MSG91
    M-->>A: OTP Sent (requestId)
    A-->>F: {status: 'pending', requestId}
    F-->>U: Show OTP Input Screen
    
    U->>F: Enter OTP Code
    F->>A: POST /auth/verify {phoneNumber, code, name}
    A->>M: Verify OTP with MSG91
    M-->>A: OTP Valid ✓
    
    alt New User
        A->>DB: Create USERCUSTOMERMASTER
        DB-->>A: User Created (userId)
    else Existing User
        A->>DB: Find USERCUSTOMERMASTER by phoneNumber
        DB-->>A: User Found (userId)
    end
    
    A->>DB: Find/Link CUSTOMERMASTER by PHONENO
    DB-->>A: Customer Data (customerId, stores)
    
    A->>J: Generate Access Token (15m expiry)
    A->>J: Generate Refresh Token (7d expiry)
    
    A-->>F: {accessToken, refreshToken, user, customer}
    F->>F: Store tokens securely
    F-->>U: Navigate to Home Screen
    
    Note over U,J: Authenticated API Request Flow
    
    U->>F: Request Protected Resource
    F->>A: API Call with Authorization: Bearer {accessToken}
    A->>J: Verify Access Token
    
    alt Token Valid
        J-->>A: Token Valid ✓
        A->>DB: Execute Query
        DB-->>A: Data
        A-->>F: Response
        F-->>U: Display Data
    else Token Expired
        J-->>A: Token Expired ✗
        A->>A: Check x-refresh-token header
        A->>J: Verify Refresh Token
        alt Refresh Valid
            J-->>A: Refresh Valid ✓
            A->>J: Generate New Access Token
            A-->>F: Response + X-New-Access-Token header
            F->>F: Update stored accessToken
            F-->>U: Display Data
        else Refresh Invalid
            J-->>A: Refresh Invalid ✗
            A-->>F: 401 {code: 'SESSION_EXPIRED'}
            F->>F: Clear tokens
            F-->>U: Redirect to Login
        end
    end
```

### JWT Token Structure

**Access Token (15 minutes expiry):**
```json
{
  "userId": 123,
  "phoneNumber": "+919876543210",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Refresh Token (7 days expiry):**
```json
{
  "userId": 123,
  "phoneNumber": "+919876543210",
  "iat": 1234567890,
  "exp": 1235172690
}
```

### Authentication Middleware Flow

```mermaid
graph TD
    A[API Request] --> B{Authorization Header?}
    B -->|No| C[Return 401 Unauthorized]
    B -->|Yes| D[Extract Access Token]
    
    D --> E{Verify Access Token}
    E -->|Valid| F[Set req.user]
    F --> G[Continue to Controller]
    
    E -->|Expired| H{Refresh Token Present?}
    H -->|No| I[Return 403 Invalid Token]
    H -->|Yes| J{Verify Refresh Token}
    
    J -->|Valid| K[Generate New Access Token]
    K --> L[Set X-New-Access-Token Header]
    L --> F
    
    J -->|Expired| M[Return 401 SESSION_EXPIRED]
    M --> N[Frontend Redirects to Login]
    
    style F fill:#4CAF50
    style C fill:#F44336
    style I fill:#F44336
    style M fill:#F44336
    style K fill:#2196F3
```

---

## 🔄 Application Flow

### Order Placement Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Cart Screen
    participant API as Backend API
    participant DB as Database
    participant INV as Inventory Service
    
    U->>C: Browse Products
    U->>C: Add to Cart
    C->>API: POST /cart {productId, quantity}
    API->>DB: Insert/Update Cart
    DB-->>API: Cart Updated
    API-->>C: {success, cart}
    
    U->>C: View Cart
    C->>API: GET /cart
    API->>DB: Fetch Cart Items
    DB-->>API: Cart Data
    API-->>C: {cartItems, total}
    
    U->>C: Proceed to Checkout
    C->>C: Select Delivery Address
    C->>API: POST /orders/place {customerId, items, address}
    
    API->>DB: BEGIN TRANSACTION
    
    API->>DB: Create Order in Orders table
    DB-->>API: OrderID
    
    loop For Each Cart Item
        API->>DB: Create OrderItem
        API->>INV: Check Product Availability
        INV-->>API: Stock Status
    end
    
    API->>DB: Calculate Order Amount
    API->>DB: Clear Cart
    API->>DB: COMMIT TRANSACTION
    
    DB-->>API: Order Created
    API-->>C: {orderId, orderNumber, status}
    C-->>U: Order Confirmation Screen
    
    Note over API,DB: Invoice Generation (Background)
    API->>DB: Create Invoice
    API->>DB: Create InvoiceItems
    DB-->>API: Invoice Created
```

### Product Browsing Flow

```mermaid
graph TD
    A[Home Screen] --> B{User Action}
    
    B -->|Browse Categories| C[GET /products/categories]
    C --> D[Display Categories Grid]
    D --> E[Select Category]
    E --> F[GET /categories/subCategories/:id]
    F --> G[Display SubCategories]
    G --> H[Select SubCategory]
    H --> I[GET /products/productsBySubCategory/:id]
    
    B -->|View Exclusive| J[GET /products/exclusive]
    B -->|View Best Selling| K[GET /products/best-selling]
    B -->|View New Products| L[GET /products/newProducts]
    B -->|View Buy Again| M[GET /products/buyAgain]
    B -->|View All Products| N[GET /products/allProducts]
    
    I --> O[Product List Screen]
    J --> O
    K --> O
    L --> O
    M --> O
    N --> O
    
    O --> P[Select Product]
    P --> Q[Product Detail Screen]
    Q --> R[GET /products/similar/:id]
    Q --> S[GET /products/catalog/:id]
    
    Q --> T{User Action}
    T -->|Add to Cart| U[POST /cart]
    T -->|Add to Favourites| V[POST /favourites]
    T -->|View Similar| R
    T -->|View Catalog| S
    
    style O fill:#81C784
    style Q fill:#64B5F6
    style U fill:#FFD54F
    style V fill:#FF8A65
```

---

## 📡 API Architecture

### API Route Structure

```
/auth                          # Authentication endpoints
├── POST /send-otp            # Send OTP via MSG91
├── POST /verify              # Verify OTP and login
├── POST /register            # Register new user
├── POST /refresh             # Refresh access token
├── POST /logout              # Logout user
├── GET  /validate-token      # Validate current token
└── GET  /check-customer      # Check customer status

/user                          # User management
├── POST /address             # Add delivery address
├── GET  /addresses           # Get all addresses
├── PUT  /addresses/:id       # Update address
├── DELETE /addresses/:id     # Delete address
├── PUT  /addresses/:id/default # Set default address
└── GET  /default-address     # Get default address

/products                      # Product catalog
├── GET /exclusive            # Exclusive products
├── GET /best-selling         # Best selling products
├── GET /newProducts          # New products
├── GET /buyAgain             # Buy again products
├── GET /allProducts          # All products
├── GET /categories           # Category list
├── GET /productsBySubCategory/:id
├── GET /similar/:productId   # Similar products
└── GET /catalog/:productId   # Catalog products

/categories
└── GET /subCategories/:categoryId

/cart                          # Shopping cart
├── GET  /                    # Get cart items
├── POST /                    # Add to cart
├── PUT  /:productId          # Update cart item
├── DELETE /:productId        # Remove from cart
└── POST /clear               # Clear cart

/favourites                    # User favourites
├── GET  /                    # Get favourites
├── POST /                    # Add to favourites
└── DELETE /:productId        # Remove from favourites

/orders                        # Order management
├── GET  /                    # Get customer orders
├── POST /place               # Place new order
└── GET  /:orderId/items      # Get order items

/invoices                      # Invoice management
├── GET  /                    # Get customer invoices
├── POST /by-customer         # Get invoices by customer
└── GET  /:invoiceId/items    # Get invoice items

/customer                      # Customer data
├── GET /check                # Check customer info
└── GET /stores               # Get customer stores
```

### API Authentication Headers

```
Authorization: Bearer {accessToken}
x-refresh-token: {refreshToken}
Content-Type: application/json
```

---

## 🛡️ Permission & Validation System

### Customer-Store Validation

```mermaid
graph TD
    A[User Authentication] --> B{User Type}
    
    B -->|Customer Exists| C[Load Customer Profile]
    B -->|New User| D[Create UserCustomerMaster]
    
    C --> E{Has Linked CUSTOMERMASTER?}
    E -->|Yes| F[Load Customer Stores]
    E -->|No| G[Limited Access Mode]
    
    F --> H{Multiple Stores?}
    H -->|Yes| I[Show Store Selector]
    H -->|No| J[Auto-Select Store]
    
    I --> K[User Selects Store]
    J --> L[Set Active CustomerId]
    K --> L
    
    L --> M[Full Access Granted]
    M --> N[Products Filtered by PriceGroup]
    M --> O[Orders Filtered by CustomerId]
    M --> P[Cart Scoped to CustomerId]
    
    G --> Q[Display Registration Prompt]
    Q --> R[Contact Support to Link Store]
    
    style M fill:#4CAF50
    style G fill:#FFA726
    style N fill:#81C784
    style O fill:#81C784
    style P fill:#81C784
```

### Order Validation Rules

| Validation | Rule | Error Response |
|------------|------|----------------|
| **Minimum Order Quantity** | `quantity >= product.MinimumQty` | "Minimum order quantity is X" |
| **Product Active Status** | `product.Active === 1` | "Product not available" |
| **Customer Active Status** | `customer.ACTIVE === true` | "Customer account inactive" |
| **Delivery Address** | Address must exist for customer | "Delivery address required" |
| **Price Group Validation** | Price based on customer's PRICEGROUPID | Applied automatically |
| **Discount Validation** | Discount based on DISCOUNTGROUPID | Applied automatically |
| **Stock Availability** | Check ProductInventory | "Insufficient stock" |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL Database
- Expo CLI (`npm install -g expo-cli`)
- Android Studio or Xcode (for mobile development)

### Backend Setup

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file:
   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/ceren_db"
   ACCESS_TOKEN_SECRET="your-access-token-secret"
   REFRESH_TOKEN_SECRET="your-refresh-token-secret"
   MSG91_API_KEY="your-msg91-api-key"
   PORT=3002
   HOST=0.0.0.0
   ```

4. **Run Prisma migrations**
   ```bash
   npm run db:generate
   npx prisma migrate dev
   ```

5. **Start the backend server**
   ```bash
   npm run dev
   ```

### Mobile App Setup

1. **Navigate to mobile app**
   ```bash
   cd MobileAppUI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.development` file:
   ```env
   EXPO_PUBLIC_API_URL=http://your-backend-ip:3002
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
   ```

4. **Start Expo development server**
   ```bash
   npx expo start -c
   ```

5. **Run on Android**
   ```bash
   npm run android
   ```

6. **Build for production**
   ```bash
   eas build --platform android --profile production
   ```

---

## 📦 Project Structure

```
CerenMobile/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth middleware
│   │   ├── routes.ts          # API routes
│   │   └── app.ts             # Express app setup
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # DB migrations
│   └── package.json
│
└── MobileAppUI/
    ├── app/
    │   ├── (tabs)/            # Tab navigation screens
    │   ├── context/           # React Context providers
    │   ├── login/             # Authentication screens
    │   ├── products/          # Product screens
    │   ├── orders/            # Order management
    │   └── invoices/          # Invoice screens
    ├── components/            # Reusable components
    ├── services/              # API service layer
    │   ├── api.ts             # HTTP client
    │   └── useAuth.ts         # Auth hook
    ├── constants/             # App constants
    └── package.json
```

---

## 🔧 Development Guidelines

### Code Style
- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Write descriptive variable and function names
- Add comments for complex business logic

### Database Best Practices
- Always use Prisma transactions for multi-table operations
- Index foreign keys for performance
- Use appropriate data types (Float for prices, DateTime for dates)
- Maintain referential integrity

### API Best Practices
- Always validate input data
- Use HTTP status codes correctly (200, 201, 400, 401, 403, 404, 500)
- Return consistent error response format
- Log errors for debugging

### Security
- Never commit `.env` files
- Use environment variables for secrets
- Implement rate limiting on auth endpoints
- Sanitize user input to prevent SQL injection
- Use HTTPS in production

---

## 📊 Performance Optimization

- **Database Query Optimization:** Use Prisma's `select` and `include` to fetch only required fields
- **Image Optimization:** Use compressed images and lazy loading
- **API Response Caching:** Cache frequently accessed data
- **Code Splitting:** Use React lazy loading for large components
- **Bundle Size:** Minimize dependencies and use tree shaking

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test

# Mobile app tests
cd MobileAppUI
npm run test
```

---

## 📱 App Features

- ✅ OTP-based authentication via MSG91
- ✅ Product catalog with categories and subcategories
- ✅ Shopping cart management
- ✅ Favourites/Wishlist
- ✅ Order placement and tracking
- ✅ Invoice viewing and management
- ✅ Multiple delivery addresses
- ✅ Google Maps integration for store locations
- ✅ Price group based pricing
- ✅ Discount management
- ✅ Real-time order status updates

---

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit changes (`git commit -m 'Add AmazingFeature'`)
3. Push to branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

---

## 📄 License

This project is proprietary and confidential.

---

## 📞 Support

For support and queries, contact the development team.

---

## 🔗 References

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MSG91 API Documentation](https://docs.msg91.com)
