import { create } from "axios";
import Constants from "expo-constants";
import { router } from "expo-router";
import type { ImagePickerAsset } from "expo-image-picker";
import { Platform } from "react-native";
import { deleteToken, getToken } from "../utils/token-storage";
import { TOKEN_KEY, API_TIMEOUT_MS } from "../config/constants";

function detectApiBaseUrl() {
  let hostname: string | undefined;

  if (Platform.OS === "web") {
    hostname = globalThis.location?.hostname;
  } else {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      try {
        hostname = new URL(`http://${hostUri}`).hostname;
      } catch {
        hostname = undefined;
      }
    }
  }

  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    hostname = Platform.OS === "android" ? "10.0.2.2" : "localhost";
  }

  return `http://${hostname}:3000`;
}

export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL?.trim() || detectApiBaseUrl()).replace(
  /\/$/,
  "",
);
export const API_BASE_URL = `${BASE_URL}/api`;

if (process.env.NODE_ENV === "production" && new URL(BASE_URL).protocol !== "https:") {
  throw new Error("A API deve usar HTTPS em builds de produção.");
}

export { TOKEN_KEY };

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export const api = create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

export function resolveMediaUrl(url: string | null | undefined) {
  if (!url) return null;

  if (url.startsWith("/")) return `${BASE_URL}${url}`;

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
  const token = await getToken(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await deleteToken(TOKEN_KEY);
      unauthorizedHandler?.();
      router.replace("/(auth)/login");
    }
    return Promise.reject(error);
  },
);

export async function toPhotoFormData(asset: ImagePickerAsset, fieldName = "photo") {
  const form = new FormData();
  const fileName = asset.fileName ?? asset.uri.split("/").pop() ?? "photo.jpg";
  const match = /\.(\w+)$/.exec(fileName);
  const extension = match?.[1].toLowerCase();
  const type =
    asset.mimeType?.toLowerCase() ??
    (extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : extension === "jpg" || extension === "jpeg"
          ? "image/jpeg"
          : "");
  if (!["image/jpeg", "image/png", "image/webp"].includes(type)) {
    throw new Error("Escolha uma imagem JPEG, PNG ou WebP.");
  }

  if (typeof globalThis.document !== "undefined") {
    const file = asset.file ?? (await fetch(asset.uri).then((response) => response.blob()));
    if (!file) throw new Error("O arquivo de imagem selecionado não está disponível.");
    form.append(fieldName, file, fileName);
  } else {
    form.append(fieldName, { uri: asset.uri, name: fileName, type } as unknown as Blob);
  }
  return form;
}
