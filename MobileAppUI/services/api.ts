import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// API Logging Configuration:
// 🔗 Shows which backend URL is being used (local vs production)
// 📡 Shows full API endpoint URLs for each request
// 🔐 Shows authentication-related API calls
// 📂 Shows product/category API calls
// 🛒 Shows cart-related API calls

interface ValidateTokenResponse {
  isValid: boolean;
  user?: {
    userId: string;
    phoneNumber: string;
  };
  newAccessToken?: string;
  error?: string;
  code?: string;
}

// Environment-based API URL configuration
const getApiUrl = (): string => {
  // Check if running in development mode
  const isDevelopment = __DEV__ || Constants.appOwnership === 'expo';

  // Check if we have an environment variable set
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envApiUrl) {
    console.log('🌍 Using environment API URL:', envApiUrl);
    console.log('📱 Environment detection - __DEV__:', __DEV__, '| appOwnership:', Constants.appOwnership);
    return envApiUrl;
  }

  // Fallback to hardcoded URLs based on environment
  if (isDevelopment) {
    const devUrl = 'http://192.168.0.12:3002';
    console.log('🏠 Using development API URL (fallback):', devUrl);
    console.log('📱 Environment detection - __DEV__:', __DEV__, '| appOwnership:', Constants.appOwnership);
    return devUrl;
  } else {
    const prodUrl = 'https://cerenmobile.onrender.com';
    console.log('🚀 Using production API URL (fallback):', prodUrl);
    console.log('📱 Environment detection - __DEV__:', __DEV__, '| appOwnership:', Constants.appOwnership);
    return prodUrl;
  }
};

const apiUrl = getApiUrl();

// Log the current API URL for debugging
console.log('🔗 API Service initialized with URL:', apiUrl);

// Helper functions to get tokens
const getAccessToken = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  return token ? `Bearer ${token}` : '';
};

const getRefreshToken = async () => {
  return await AsyncStorage.getItem('refreshToken') || '';
};

const getCustomerId = async (): Promise<number | null> => {
  const customerId = await AsyncStorage.getItem('customerId');
  return customerId ? Number(customerId) : null;
};

// Helper to get selected store's customerId (from SelectStore screen)
const getSelectedStoreId = async (): Promise<number | null> => {
  const storeId = await AsyncStorage.getItem('selectedStoreId');
  const result = storeId ? Number(storeId) : null;
  console.log('🔑 [getSelectedStoreId] Retrieved:', storeId, '→ Returning:', result);
  return result;
};

export const validateTokens = async (accessToken: string, refreshToken: string | null): Promise<ValidateTokenResponse> => {
  const endpoint = `${apiUrl}/auth/validate-token`;
  console.log('🔐 Validate Token API call:', endpoint);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...(refreshToken && { 'x-refresh-token': refreshToken })
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Token validation error:', error);
    return {
      isValid: false,
      error: 'Failed to validate tokens'
    };
  }
};
export const register = async (phoneNumber: string, name: string): Promise<{ success: boolean; message?: string }> => {
  const endpoint = `${apiUrl}/auth/register`;
  console.log('📡 Register API call:', endpoint);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.message || 'Failed to register' };
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Register API error:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
};
// Public check if a customer exists by phone
export const checkCustomer = async (phoneNumber: string): Promise<{ success: boolean; exists?: boolean; userId?: number; customerId?: number; name?: string; message?: string }> => {
  const endpoint = `${apiUrl}/auth/check-customer?phone=${encodeURIComponent(phoneNumber)}`;
  console.log('📡 Check Customer API call:', endpoint);
  try {
    const response = await fetch(endpoint, { method: 'GET' });
    const text = await response.text();
    console.log('📡 Check customer HTTP status:', response.status);
    try {
      const data = text ? JSON.parse(text) : null;
      console.log('📡 Check customer parsed response:', data);
      return data;
    } catch (err) {
      console.warn('Check customer: non-JSON response', text && text.slice(0, 500));
      return { success: false, message: 'Invalid server response' };
    }
  } catch (error) {
    console.error('Check customer API error:', error);
    return { success: false, message: 'Network error' };
  }
};

// Public send OTP endpoint
export const sendOtp = async (phone: string, customerId?: number): Promise<{ success: boolean; message?: string; requestId?: string }> => {
  const endpoint = `${apiUrl}/auth/send-otp`;
  console.log('📡 Send OTP API call:', endpoint);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, customerId }),
    });
    const text = await response.text();
    try {
      const data = text ? JSON.parse(text) : null;
      return data;
    } catch (err) {
      console.warn('Send OTP: non-JSON response', text && text.slice(0, 500));
      return { success: false, message: 'Invalid server response' };
    }
  } catch (error) {
    console.error('Send OTP API error:', error);
    return { success: false, message: 'Network error' };
  }
};
export const verify = async (phoneNumber: string, code: string, name: string): Promise<{ success: boolean; accessToken?: string; refreshToken?: string; user?: { id: number; name: string; phoneNumber: string }; message?: string }> => {
  const endpoint = `${apiUrl}/auth/verify`;
  console.log('📡 Verify OTP API call:', endpoint);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, code, name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.message || 'Failed to verify OTP' };
    }

    const data = await response.json();
    return {
      success: true,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  } catch (error) {
    console.error('Verify API error:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
};

// Fetch stores for current authenticated user (uses access token)
export const getStoresForUser = async (): Promise<{ success: boolean; stores?: Array<any>; message?: string }> => {
  const endpoint = `${apiUrl}/customer/stores`;
  console.log('📡 Get Stores API call:', endpoint);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: errorData.message || 'Failed to fetch stores' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get stores API error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const getExclusiveOffers = async () => {
  try {
    console.log("Fetching exclusive offers...");
    const response = await fetch(`${apiUrl}/products/exclusive`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      },
    });

    console.log("Response status:", response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error fetching exclusive offers:", errorData);
      return { success: false, products: [], message: errorData.message };
    }

    const data = await response.json();
    console.log("Exclusive offers fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Error fetching exclusive offers:", error);
    return { success: false, products: [] };
  }
};



export const getNewProducts = async () => {
  try {
    console.log("Fetching new products...");
    
    // Get selected store's customerId for pricing
    const selectedStoreId = await getSelectedStoreId();
    const queryParams = new URLSearchParams(
      selectedStoreId ? { customerId: String(selectedStoreId) } : {}
    );
    
    const response = await fetch(`${apiUrl}/products/newProducts?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
        ...(selectedStoreId && { 'x-customer-id': String(selectedStoreId) })
      },
    });

    console.log("Response status:", response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error fetching  new products:", errorData);
      return { success: false, products: [], message: errorData.message };
    }

    const data = await response.json();
    console.log("New products fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Error fetching new products:", error);
    return { success: false, products: [] };
  }
};


export const getBuyAgainProducts = async () => {
  try {
    console.log("Fetching buy again products...");
    
    // Get selected store's customerId for pricing
    const selectedStoreId = await getSelectedStoreId();
    const queryParams = new URLSearchParams(
      selectedStoreId ? { customerId: String(selectedStoreId) } : {}
    );
    
    const response = await fetch(`${apiUrl}/products/buyAgain?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
        ...(selectedStoreId && { 'x-customer-id': String(selectedStoreId) })
      },
    });

    console.log("Response status:", response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error fetching buy again products:", errorData);
      return { success: false, products: [], message: errorData.message };
    }

    const data = await response.json();
    console.log("Buy again products fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Error fetching buy again products:", error);
    return { success: false, products: [] };
  }
};



export const getBestSelling = async (limit: number = 50) => {
  try {
    console.log("📦 [getBestSelling] Fetching best selling products with limit:", limit);
    
    // Get selected store's customerId for pricing
    const selectedStoreId = await getSelectedStoreId();
    console.log("📦 [getBestSelling] Selected Store ID:", selectedStoreId);
    
    const queryParams = new URLSearchParams({
      limit: String(limit),
      ...(selectedStoreId && { customerId: String(selectedStoreId) })
    });
    
    const url = `${apiUrl}/products/best-selling?${queryParams}`;
    console.log("📦 [getBestSelling] Request URL:", url);
    console.log("📦 [getBestSelling] CustomerId in headers:", selectedStoreId ? String(selectedStoreId) : 'NONE');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
        ...(selectedStoreId && { 'x-customer-id': String(selectedStoreId) })
      },
    });

    console.log("📦 [getBestSelling] Response status:", response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ [getBestSelling] Error fetching best selling products:", errorData);
      return { success: false, products: [], message: errorData.message };
    }

    const data = await response.json();
    console.log("✅ [getBestSelling] Products fetched successfully!");
    console.log("📦 [getBestSelling] showPricing flag from backend:", data.showPricing);
    console.log("📦 [getBestSelling] customerId from backend:", data.customerId);
    console.log("📦 [getBestSelling] First product sample:", data.products && data.products[0] ? {
      name: data.products[0].ProductName || data.products[0].name,
      price: data.products[0].price || data.products[0].Price
    } : 'No products');
    return data;
  } catch (error) {
    console.error("Error fetching best selling products:", error);
    return { success: false, products: [] };
  }
};

export const getCategories = async () => {
  const endpoint = `${apiUrl}/products/categories`;
  console.log('📂 Get Categories API call:', endpoint);

  try {
    console.log("Fetching categories...");
    const selectedStoreId = await getSelectedStoreId();
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
        ...(selectedStoreId && { 'x-customer-id': String(selectedStoreId) })
      },
    });

    console.log("Response status:", response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error fetching categories:", errorData);
      return { success: false, categories: [], message: errorData.message };
    }

    const data = await response.json();
    console.log("Categories fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, categories: [] };
  }
};

// Fetch subcategories for a given categoryId
export const getSubCategories = async (categoryId: number) => {
  try {
    console.log(`Fetching subcategories for categoryId=${categoryId}...`);
    const selectedStoreId = await getSelectedStoreId();
    const queryParams = new URLSearchParams(
      selectedStoreId ? { customerId: String(selectedStoreId) } : {}
    );
    
    const response = await fetch(`${apiUrl}/categories/subCategories/${categoryId}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
        ...(selectedStoreId && { 'x-customer-id': String(selectedStoreId) })
      },
    });

    console.log('Response status:', response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching subcategories:', errorData);
      return { success: false, subCategories: [], message: errorData.message };
    }

    const data = await response.json();
    console.log('Subcategories fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return { success: false, subCategories: [] };
  }
};

// Fetch products belonging to a subcategory
export const getProductsBySubCategory = async (subCategoryId: number) => {
  try {
    console.log(`Fetching products for subCategoryId=${subCategoryId}...`);
    const selectedStoreId = await getSelectedStoreId();
    const queryParams = new URLSearchParams(
      selectedStoreId ? { customerId: String(selectedStoreId) } : {}
    );
    
    const response = await fetch(`${apiUrl}/products/productsBySubCategory/${subCategoryId}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
        ...(selectedStoreId && { 'x-customer-id': String(selectedStoreId) }),
      },
    });

    console.log('Response status:', response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching products by subcategory:', errorData);
      return { success: false, products: [], message: errorData.message };
    }

    const data = await response.json();
    console.log('Products by subcategory fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching products by subcategory:', error);
    return { success: false, products: [] };
  }
};

// Given a productId, fetch other products that belong to the same CatalogID
export const getProductsByCatalog = async (productId: number) => {
  try {
    console.log(`Fetching products for catalog of productId=${productId}...`);
    const selectedStoreId = await getSelectedStoreId();
    const queryParams = new URLSearchParams(
      selectedStoreId ? { customerId: String(selectedStoreId) } : {}
    );
    
    const response = await fetch(`${apiUrl}/products/catalog/${productId}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
        ...(selectedStoreId && { 'x-customer-id': String(selectedStoreId) }),
      }
    });

    console.log('Response status:', response.status);
    if (!response.ok) {
      const err = await response.json();
      console.error('Error fetching products by catalog:', err);
      return { success: false, products: [], message: err.message };
    }

    const data = await response.json();
    console.log('Products by catalog fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching products by catalog:', error);
    return { success: false, products: [] };
  }
};

export const getSimilarProductsApi = async (productId: number) => {
  try {
    console.log(`Fetching similar products for productId=${productId}...`);
    const selectedStoreId = await getSelectedStoreId();
    const queryParams = new URLSearchParams(
      selectedStoreId ? { customerId: String(selectedStoreId) } : {}
    );
    
    const response = await fetch(`${apiUrl}/products/similar/${productId}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
        ...(selectedStoreId && { 'x-customer-id': String(selectedStoreId) }),
      }
    });

    console.log('Response status:', response.status);
    if (!response.ok) {
      const err = await response.json();
      console.error('Error fetching similar products:', err);
      return { success: false, products: [], message: err.message };
    }

    const data = await response.json();
    console.log('Similar products fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching similar products:', error);
    return { success: false, products: [] };
  }
};

export async function checkCustomerExists() {
  const response = await fetch(`${apiUrl}/customer/check`, {
    method: "GET",
    headers: {
      'Authorization': await getAccessToken(),
      'x-refresh-token': await getRefreshToken(),
    },
  });

  if (!response.ok) {
    console.error("Error checking customer existence:", response.statusText);
    return { success: false, exists: false, message: "Failed to check customer existence" };
  }

  return response.json();
}

// Favourites API helpers
export const fetchFavourites = async () => {
  try {
    // Get selected store's customerId
    const selectedStoreId = await getSelectedStoreId();
    
    if (!selectedStoreId) {
      console.warn('No customerId available for fetchFavourites');
      return { success: false, favourites: [], message: 'No store selected' };
    }

    const response = await fetch(`${apiUrl}/favourites?customerId=${selectedStoreId}`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      }
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, favourites: [], message: err.message };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching favourites:', error);
    return { success: false, favourites: [] };
  }
};

export const addFavouriteApi = async (product: any) => {
  try {
    // Get selected store's customerId
    const selectedStoreId = await getSelectedStoreId();
    
    if (!selectedStoreId) {
      console.warn('No customerId available for addFavouriteApi');
      return { success: false, message: 'No store selected' };
    }

    const response = await fetch(`${apiUrl}/favourites?customerId=${selectedStoreId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      },
      body: JSON.stringify(product)
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.message };
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding favourite:', error);
    return { success: false };
  }
};

export const removeFavouriteApi = async (productId: number) => {
  try {
    // Get selected store's customerId
    const selectedStoreId = await getSelectedStoreId();
    
    if (!selectedStoreId) {
      console.warn('No customerId available for removeFavouriteApi');
      return { success: false, message: 'No store selected' };
    }

    const response = await fetch(`${apiUrl}/favourites/${productId}?customerId=${selectedStoreId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      }
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.message };
    }

    return await response.json();
  } catch (error) {
    console.error('Error removing favourite:', error);
    return { success: false };
  }
};

// Cart API helpers
export const getCart = async () => {
  try {
    // Get selected store's customerId
    const selectedStoreId = await getSelectedStoreId();
    
    if (!selectedStoreId) {
      console.warn('No customerId available for getCart');
      return { success: false, cart: [], message: 'No store selected' };
    }

    const endpoint = `${apiUrl}/cart?customerId=${selectedStoreId}`;
    console.log('🛒 Get Cart API call:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      }
    });
    if (!response.ok) return { success: false, cart: [] };
    return await response.json();
  } catch (error) {
    console.error('Error fetching cart:', error);
    return { success: false, cart: [] };
  }
};

export const addToCartApi = async (product: any) => {
  try {
    // Get selected store's customerId
    const selectedStoreId = await getSelectedStoreId();
    
    if (!selectedStoreId) {
      console.warn('No customerId available for addToCartApi');
      return { success: false, message: 'No store selected' };
    }

    const response = await fetch(`${apiUrl}/cart?customerId=${selectedStoreId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      },
      body: JSON.stringify(product)
    });
    if (!response.ok) return { success: false };
    return await response.json();
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false };
  }
};

// Fetch orders for a customer (optional customerId for testing)
export const getOrders = async (customerId?: number) => {
  try {
    const url = `${apiUrl}/orders${typeof customerId === 'number' ? `?customerid=${customerId}` : ''}`;
    console.log('📡 Get Orders API call:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
        'Content-Type': 'application/json'
      }
    });

    console.log('Get Orders response status:', response.status);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Error fetching orders:', err);
      return { success: false, orders: [], message: err.message || 'Failed to fetch orders' };
    }

    const data = await response.json();
    console.log('Orders fetched:', data);
    return data;
  } catch (error) {
    console.error('Error in getOrders:', error);
    return { success: false, orders: [] };
  }
};

// Fetch invoices for a customer
export const getInvoices = async (customerId?: number) => {
  try {
    const id = customerId || await getCustomerId();
    const url = `${apiUrl}/invoices${id ? `?customerid=${id}` : ''}`;
    console.log('📡 Get Invoices API call:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
        'Content-Type': 'application/json'
      }
    });

    console.log('Get Invoices response status:', response.status);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Error fetching invoices:', err);
      return { success: false, invoices: [], message: err.message || 'Failed to fetch invoices' };
    }

    const data = await response.json();
    console.log('Invoices fetched:', data);
    return data;
  } catch (error) {
    console.error('Error in getInvoices:', error);
    return { success: false, invoices: [] };
  }
};

// Fetch invoice items for a specific invoice
export const getInvoiceItems = async (invoiceId: number) => {
  try {
    const endpoint = `${apiUrl}/invoices/${invoiceId}/items`;
    console.log('📡 Get Invoice Items API call:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
        'Content-Type': 'application/json'
      }
    });

    console.log('Get Invoice Items response status:', response.status);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Error fetching invoice items:', err);
      return { success: false, invoiceItems: [], message: err.message || 'Failed to fetch invoice items' };
    }

    const data = await response.json();
    console.log('Invoice items fetched:', data);
    return data;
  } catch (error) {
    console.error('Error in getInvoiceItems:', error);
    return { success: false, invoiceItems: [] };
  }
};

// Fetch invoices by customer and date range
export const getInvoicesByCustomerAndDateRange = async (
  fromDateTime: string,
  toDateTime: string,
  customerId?: number
) => {
  try {
    const id = customerId || await getSelectedStoreId() || await getCustomerId();
    
    if (!id) {
      console.error('No customer ID available');
      return { success: false, invoices: [], message: 'Customer ID required' };
    }

    const endpoint = `${apiUrl}/invoices/by-customer`;
    console.log('📡 Get Invoices By Date Range API:', endpoint);
    console.log('📅 Parameters:', { FromDateTime: fromDateTime, ToDateTime: toDateTime, CustomerID: id });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        FromDateTime: fromDateTime,
        ToDateTime: toDateTime,
        CustomerID: id
      })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Error fetching invoices:', err);
      return { success: false, invoices: [], message: err.message || err.error || 'Failed to fetch invoices' };
    }

    const data = await response.json();
    console.log('📊 Invoices fetched:', Array.isArray(data) ? data.length : 'non-array');
    
    // API returns array directly
    return { success: true, invoices: Array.isArray(data) ? data : [] };
  } catch (error: any) {
    console.error('Error in getInvoicesByCustomerAndDateRange:', error);
    return { success: false, invoices: [], message: error.message || 'Network error' };
  }
};

// Fetch order items for a specific order
export const getOrderItems = async (orderId: number) => {
  try {
    const endpoint = `${apiUrl}/orders/${orderId}/items`;
    console.log('📡 Get Order Items API call:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
        'Content-Type': 'application/json'
      }
    });

    console.log('Get Order Items response status:', response.status);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Error fetching order items:', err);
      return { success: false, orderItems: [], message: err.message || 'Failed to fetch order items' };
    }

    const data = await response.json();
    console.log('Order items fetched:', data);
    return data;
  } catch (error) {
    console.error('Error in getOrderItems:', error);
    return { success: false, orderItems: [] };
  }
};

export const updateCartApi = async (productId: number, quantity: number) => {
  try {
    // Get selected store's customerId
    const selectedStoreId = await getSelectedStoreId();
    
    if (!selectedStoreId) {
      console.warn('No customerId available for updateCartApi');
      return false;
    }

    const response = await fetch(`${apiUrl}/cart/${productId}?customerId=${selectedStoreId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      },
      body: JSON.stringify({ quantity })
    });
    return response.ok;
  } catch (error) {
    console.error('Error updating cart:', error);
    return false;
  }
};

export const removeCartApi = async (productId: number) => {
  try {
    // Get selected store's customerId
    const selectedStoreId = await getSelectedStoreId();
    
    if (!selectedStoreId) {
      console.warn('No customerId available for removeCartApi');
      return false;
    }

    const response = await fetch(`${apiUrl}/cart/${productId}?customerId=${selectedStoreId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Error removing cart item:', error);
    return false;
  }
};

export const clearCartApi = async () => {
  try {
    // Get selected store's customerId
    const selectedStoreId = await getSelectedStoreId();
    
    if (!selectedStoreId) {
      console.warn('No customerId available for clearCartApi');
      return false;
    }

    const response = await fetch(`${apiUrl}/cart/clear?customerId=${selectedStoreId}`, {
      method: 'POST',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
};

// Address management API helpers
export const sendAddressDetails = async (payload: {
  name: string;
  phoneNumber: string;
  city: string;
  district: string;
  houseNumber: string;
  buildingBlock: string;
  pinCode: string;
  landmark?: string;
  saveAs?: string;
  isDefault?: boolean;
}): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${apiUrl}/user/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.message || 'Failed to send address details' };
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Send Address Details API error:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
};

export const getUserAddresses = async () => {
  try {
    const response = await fetch(`${apiUrl}/user/addresses`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      }
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, addresses: [], message: err.message };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    return { success: false, addresses: [] };
  }
};

export const setDefaultAddress = async (addressId: number) => {
  try {
    const response = await fetch(`${apiUrl}/user/addresses/${addressId}/default`, {
      method: 'PUT',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      }
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.message };
    }

    return await response.json();
  } catch (error) {
    console.error('Error setting default address:', error);
    return { success: false };
  }
};

export const getDefaultAddress = async () => {
  try {
    const response = await fetch(`${apiUrl}/user/default-address`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      }
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, address: null, message: err.message };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching default address:', error);
    return { success: false, address: null };
  }
};

export const getUserMasterAddress = async () => {
  try {
    const response = await fetch(`${apiUrl}/user/master-address`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      }
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, address: null, message: err.message };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user master address:', error);
    return { success: false, address: null };
  }
};

export const updateUserAddress = async (addressId: number, addressData: any) => {
  try {
    const response = await fetch(`${apiUrl}/user/addresses/${addressId}`, {
      method: 'PUT',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addressData)
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.message };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating address:', error);
    return { success: false, message: 'Failed to update address' };
  }
};

export const deleteUserAddress = async (addressId: number) => {
  try {
    const response = await fetch(`${apiUrl}/user/addresses/${addressId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      }
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.message };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting address:', error);
    return { success: false, message: 'Failed to delete address' };
  }
};

// Place order via external API
export const placeOrder = async (
  customerId: number,
  customerName: string,
  orderItems: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: number;
  }>
): Promise<{ success: boolean; message?: string; data?: any }> => {
  try {
    const endpoint = `${apiUrl}/orders/place`;
    console.log('📦 Place Order API call:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      },
      body: JSON.stringify({
        customerId,
        customerName,
        orderItems,
      }),
    });

    console.log('Place Order response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error placing order:', errorData);
      return {
        success: false,
        message: errorData.error || errorData.message || 'Failed to place order',
      };
    }

    const data = await response.json();
    console.log('✅ Order placed successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Error in placeOrder:', error);
    return {
      success: false,
      message: error.message || 'Network error while placing order',
    };
  }
};

