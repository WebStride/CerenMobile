import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchFavourites, addFavouriteApi, removeFavouriteApi } from '../../services/api';

interface Product {
  productId: number;
  productName: string;
  productUnits: number;
  unitsOfMeasurement: string;
  price: number;
  image: string | null;
  minQuantity?: number;
}

interface FavouritesContextType {
  favourites: Product[];
  addToFavourites: (product: Product) => void;
  removeFromFavourites: (productId: number) => void;
  isFavourite: (productId: number) => boolean;
  favouritesCount: number;
}

const FavouritesContext = createContext<FavouritesContextType | undefined>(undefined);

export const FavouritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favourites, setFavourites] = useState<Product[]>([]);

  // Load favourites from server (or fallback to AsyncStorage)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res: any = await fetchFavourites();
        if (mounted && res?.success) {
          // map server shape to Product type if needed
          const mapped = res.favourites.map((f: any) => ({
            productId: f.productId || f.productId,
            productName: f.productName,
            productUnits: f.productUnits || 0,
            unitsOfMeasurement: f.unitsOfMeasurement || '',
            price: f.price || 0,
            image: f.image || null,
            minQuantity: f.minQuantity || f.minOrderQuantity || 1
          }));
          setFavourites(mapped);
          await AsyncStorage.setItem('favourites', JSON.stringify(mapped));
          return;
        }
      } catch (e) {
        // ignore and fallback to AsyncStorage
      }

      // fallback: load from AsyncStorage
      try {
        const local = await AsyncStorage.getItem('favourites');
        if (local && mounted) setFavourites(JSON.parse(local));
      } catch (e) {
        console.error('Failed to load favourites from storage', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const addToFavourites = useCallback(async (product: Product) => {
    // Check if user is registered before adding to favourites
    try {
      const { checkCustomerExists } = await import('../../services/api');
      const customerCheck = await checkCustomerExists();
      
      if (!customerCheck.success || !customerCheck.exists) {
        // Don't add to favourites for unregistered users
        console.log('Cannot add to favourites: User not registered');
        return;
      }

      // optimistic update for registered users
      const updatedFavourites = [...favourites, product];
      setFavourites(updatedFavourites);
      await AsyncStorage.setItem('favourites', JSON.stringify(updatedFavourites));
      // persist to server
      addFavouriteApi(product).catch(err => {
        console.error('Persisting favourite failed:', err);
      });
    } catch (error) {
      console.error('Error adding to favourites:', error);
    }
  }, [favourites]);

  const removeFromFavourites = useCallback(async (productId: number) => {
    try {
      const updatedFavourites = favourites.filter(item => item.productId !== productId);
      setFavourites(updatedFavourites);
      await AsyncStorage.setItem('favourites', JSON.stringify(updatedFavourites));
      // persist removal
      removeFavouriteApi(productId).catch(err => {
        console.error('Removing favourite on server failed:', err);
      });
    } catch (error) {
      console.error('Error removing from favourites:', error);
    }
  }, [favourites]);

  const isFavourite = useCallback((productId: number) => {
    return favourites.some(item => item.productId === productId);
  }, [favourites]);

  const favouritesCount = favourites.length;

  const value: FavouritesContextType = {
    favourites,
    addToFavourites,
    removeFromFavourites,
    isFavourite,
    favouritesCount,
  };

  return (
    <FavouritesContext.Provider value={value}>
      {children}
    </FavouritesContext.Provider>
  );
};

export const useFavourites = () => {
  const context = useContext(FavouritesContext);
  if (context === undefined) {
    throw new Error('useFavourites must be used within a FavouritesProvider');
  }
  return context;
};
