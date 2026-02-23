import AsyncStorage from "@react-native-async-storage/async-storage";

export const SESSION_MODE_KEY = "sessionMode";

export async function isGuestSession(): Promise<boolean> {
  const mode = await AsyncStorage.getItem(SESSION_MODE_KEY);
  return mode === "guest";
}

export async function setGuestSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    "accessToken",
    "refreshToken",
    "userData",
    "customerId",
    "selectedStoreId",
    "selectedStoreName",
  ]);
  await AsyncStorage.setItem(SESSION_MODE_KEY, "guest");
}

export async function setAuthenticatedSession(): Promise<void> {
  await AsyncStorage.setItem(SESSION_MODE_KEY, "authenticated");
}

export async function clearSessionMode(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_MODE_KEY);
}
