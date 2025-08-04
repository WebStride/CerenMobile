import AsyncStorage from '@react-native-async-storage/async-storage';

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

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

// Helper functions to get tokens
const getAccessToken = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  return token ? `Bearer ${token}` : '';
};

const getRefreshToken = async () => {
  return await AsyncStorage.getItem('refreshToken') || '';
};
if (!apiUrl) {
  throw new Error('API_URL is not defined in the environment variables');
}
export const validateTokens = async (accessToken: string, refreshToken: string | null): Promise<ValidateTokenResponse> => {
  try {
    const response = await fetch(`${apiUrl}/api/validate-token`, {
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
  try {
    const response = await fetch(`${apiUrl}/auth/register`, {
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
  try {
    const response = await fetch(`${apiUrl}/auth/verify`, {
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
export const sendAddressDetails = async (payload: {
  name : any;
  phoneNumber: any;
  city: string;
  district: string;
  houseNumber: string;
  buildingBlock: string;
  pinCode: string;
  landmark: string;
}): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${apiUrl}/user/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
  try {
    console.log("Fetching categories...");
    const response = await fetch(`${apiUrl}/products/categories`, {
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
