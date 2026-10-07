import * as SecureStore from "expo-secure-store";

export async function getToken(key: string) {
  return SecureStore.getItemAsync(key);
}

export async function setToken(key: string, value: string) {
  return SecureStore.setItemAsync(key, value);
}

export async function deleteToken(key: string) {
  return SecureStore.deleteItemAsync(key);
}
