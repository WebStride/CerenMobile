import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Product {
  productId: number;
  productName: string;
  productUnits: number;
  unitsOfMeasurement: string;
  price: number;
  image: string | null;
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

  const addToFavourites = useCallback(async (product: Product) => {
    try {
      const updatedFavourites = [...favourites, product];
      setFavourites(updatedFavourites);
      await AsyncStorage.setItem('favourites', JSON.stringify(updatedFavourites));
    } catch (error) {
      console.error('Error adding to favourites:', error);
    }
  }, [favourites]);

  const removeFromFavourites = useCallback(async (productId: number) => {
    try {
      const updatedFavourites = favourites.filter(item => item.productId !== productId);
      setFavourites(updatedFavourites);
      await AsyncStorage.setItem('favourites', JSON.stringify(updatedFavourites));
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
