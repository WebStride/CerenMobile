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
