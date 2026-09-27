import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roomsApi } from "../api/rooms";
import { RoomPhotoSlot } from "../types";

export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: async () => (await roomsApi.list()).data.rooms,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}

export function useRoom(roomId: number) {
  return useQuery({
    queryKey: ["rooms", roomId],
    queryFn: async () => (await roomsApi.get(roomId)).data.room,
    enabled: !!roomId,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: roomsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

export function useUpdateRoom(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof roomsApi.update>[1]) => roomsApi.update(roomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", roomId] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useRemoveRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: roomsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

export function useUploadRoomPhoto(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slot, uri }: { slot: RoomPhotoSlot; uri: string }) =>
      roomsApi.uploadPhoto(roomId, slot, uri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", roomId] });
    },
  });
}

export function useDeleteRoomPhoto(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slot: RoomPhotoSlot) => roomsApi.deletePhoto(roomId, slot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", roomId] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useCollaborators(roomId: number) {
  return useQuery({
    queryKey: ["rooms", roomId, "collaborators"],
    queryFn: async () => (await roomsApi.listCollaborators(roomId)).data.collaborators,
    enabled: !!roomId,
  });
}

export function useAddCollaborator(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => roomsApi.addCollaborator(roomId, userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["rooms", roomId, "collaborators"] }),
  });
}

export function useRemoveCollaborator(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collaboratorId: number) => roomsApi.removeCollaborator(roomId, collaboratorId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["rooms", roomId, "collaborators"] }),
  });
}
