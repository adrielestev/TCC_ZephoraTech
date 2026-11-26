// src/features/rooms/hooks.ts -- Fornece consultas e ações de salas integradas ao cache de dados.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/core/query/keys';
import { roomsApi, type RoomInput } from './api';

export const useRooms = () => useQuery({ queryKey: qk.rooms, queryFn: roomsApi.list });

export const useRoom = (id: number) =>
  useQuery({ queryKey: qk.room(id), queryFn: () => roomsApi.get(id) });

export const useRoomAccess = (id: number) =>
  useQuery({ queryKey: qk.roomAccess(id), queryFn: () => roomsApi.listAccess(id) });

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RoomInput) => roomsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.rooms }),
  });
}

export function useUpdateRoom(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<RoomInput>) => roomsApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.rooms }),
  });
}

export function useDeleteRoom(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => roomsApi.remove(id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: qk.room(id) });
      return qc.invalidateQueries({ queryKey: qk.rooms });
    },
  });
}
