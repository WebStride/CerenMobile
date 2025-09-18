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

export const validateTokens = async (accessToken: string, refreshToken: string | null): Promise<ValidateTokenResponse> => {
  const endpoint = `${apiUrl}/api/validate-token`;
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
    const response = await fetch(`${apiUrl}/products/newProducts`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
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
    const response = await fetch(`${apiUrl}/products/buyAgain`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
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
    console.log("Fetching best selling products with limit:", limit);
    const response = await fetch(`${apiUrl}/products/best-selling?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
      },
    });

    console.log("Response status:", response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error fetching best selling products:", errorData);
      return { success: false, products: [], message: errorData.message };
    }

    const data = await response.json();
    console.log("Best selling products fetched successfully:", data);
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
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
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
    const response = await fetch(`${apiUrl}/categories/subCategories/${categoryId}`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
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
    const response = await fetch(`${apiUrl}/products/productsBySubCategory/${subCategoryId}`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
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
    const response = await fetch(`${apiUrl}/products/catalog/${productId}`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
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
    const response = await fetch(`${apiUrl}/products/similar/${productId}`, {
      method: 'GET',
      headers: {
        'Authorization': await getAccessToken(),
        'x-refresh-token': await getRefreshToken(),
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
    const response = await fetch(`${apiUrl}/favourites`, {
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
    const response = await fetch(`${apiUrl}/favourites`, {
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
    const response = await fetch(`${apiUrl}/favourites/${productId}`, {
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
  const endpoint = `${apiUrl}/cart`;
  console.log('🛒 Get Cart API call:', endpoint);

  try {
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
    const response = await fetch(`${apiUrl}/cart`, {
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

export const updateCartApi = async (productId: number, quantity: number) => {
  try {
    const response = await fetch(`${apiUrl}/cart/${productId}`, {
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
    const response = await fetch(`${apiUrl}/cart/${productId}`, {
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
    const response = await fetch(`${apiUrl}/cart/clear`, {
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
