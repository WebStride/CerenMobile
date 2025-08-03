import { useState, useCallback } from 'react';
import { validateTokens } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseAuthValidation {
  validateAuth: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export const useAuthValidation = (): UseAuthValidation => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAuth = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (!accessToken) {
        return false;
      }

      const response = await validateTokens(accessToken, refreshToken);

      if (response.isValid) {
        // If a new access token was issued, save it
        if (response.newAccessToken) {
          await AsyncStorage.setItem('accessToken', response.newAccessToken);
        }
        return true;
      }

      // If tokens are invalid, clear them
      if (!response.isValid) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      }

      return false;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to validate authentication');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { validateAuth, isLoading, error };
};
