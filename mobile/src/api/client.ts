import { create } from "axios";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const TOKEN_KEY = "zephora_token";

export const api = create({
  baseURL: BASE_URL,
  timeout: 15000,
});

export function resolveMediaUrl(url: string | null | undefined) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const baseUrl = new URL(BASE_URL);
    if (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1") {
      return `${baseUrl.origin}${parsedUrl.pathname}${parsedUrl.search}`;
    }
  } catch {
    return url;
  }

  return url;
}

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      router.replace("/(auth)/login");
    }
    return Promise.reject(error);
  },
);

export function toPhotoFormData(uri: string, fieldName = "photo") {
  const form = new FormData();
  const fileName = uri.split("/").pop() ?? "photo.jpg";
  const match = /\.(\w+)$/.exec(fileName);
  const extension = match?.[1].toLowerCase();
  const type =
    extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";

  form.append(fieldName, { uri, name: fileName, type } as unknown as Blob);
  return form;
}
