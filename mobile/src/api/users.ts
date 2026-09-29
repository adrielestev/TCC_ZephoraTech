import { api, toPhotoFormData } from "./client";
import type { ImagePickerAsset } from "expo-image-picker";
import { User, UserLevel } from "../types";

export const usersApi = {
  list: (params?: { q?: string; limit?: number; offset?: number }) =>
    api.get<{ users: User[] }>("/users", { params }),

  updateMe: (data: Partial<Pick<User, "name">>) => api.patch<{ user: User }>("/users/me", data),

  updateLevel: (userId: number, user_level: UserLevel) =>
    api.patch<{ user: User }>(`/users/${userId}/level`, { user_level }),

  uploadMyPhoto: async (asset: ImagePickerAsset) =>
    api.post<{ user: User }>("/users/me/photo", await toPhotoFormData(asset)),

  deleteMyPhoto: () => api.delete("/users/me/photo"),

  softDelete: (userId: number) => api.delete(`/users/${userId}`),
};
