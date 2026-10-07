import { api, toPhotoFormData } from "./client";
import type { ImagePickerAsset } from "expo-image-picker";
import { Collaborator, Room, RoomPhotoSlot } from "../types";

export const roomsApi = {
  list: () => api.get<{ rooms: Room[] }>("/rooms"),

  get: (roomId: number) => api.get<{ room: Room; sensors: unknown[] }>(`/rooms/${roomId}`),

  create: (data: { name: string; classroom_code: string; mac_address: string }) =>
    api.post<{ room: Room }>("/rooms", data),

  update: (roomId: number, data: Partial<Pick<Room, "name" | "classroom_code" | "mac_address">>) =>
    api.patch<{ room: Room }>(`/rooms/${roomId}`, data),

  remove: (roomId: number) => api.delete(`/rooms/${roomId}`),

  /** Gera ou rotaciona a credencial do ESP32. O segredo só é devolvido nesta resposta. */
  generateDeviceCredential: (roomId: number) =>
    api.post<{ credential: string }>(`/rooms/${roomId}/device-credential`),

  uploadPhoto: async (roomId: number, slot: RoomPhotoSlot, asset: ImagePickerAsset) =>
    api.post<{ room: Room }>(`/rooms/${roomId}/photos/${slot}`, await toPhotoFormData(asset)),

  deletePhoto: (roomId: number, slot: RoomPhotoSlot) =>
    api.delete(`/rooms/${roomId}/photos/${slot}`),

  listCollaborators: (roomId: number) =>
    api.get<{ collaborators: Collaborator[] }>(`/rooms/${roomId}/collaborators`),

  addCollaborator: (roomId: number, userId: number) =>
    api.post<{ collaborator: Collaborator }>(`/rooms/${roomId}/collaborators`, { user_id: userId }),

  removeCollaborator: (roomId: number, collaboratorId: number) =>
    api.delete(`/rooms/${roomId}/collaborators/${collaboratorId}`),
};
