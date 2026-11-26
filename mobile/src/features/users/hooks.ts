// src/features/users/hooks.ts -- Fornece consultas paginadas e individuais de usuários para as telas administrativas.
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/core/query/keys';
import { usersApi } from './api';

export function useUsers(search: string) {
  return useInfiniteQuery({
    queryKey: qk.users(search),
    queryFn: ({ pageParam }) => usersApi.list({ q: search, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const next = last.offset + last.limit;
      return next < last.total ? next : undefined;
    },
  });
}

export const useUser = (id: number) =>
  useQuery({ queryKey: qk.user(id), queryFn: () => usersApi.get(id) });

export const useUserRooms = (id: number) =>
  useQuery({ queryKey: qk.userRooms(id), queryFn: () => usersApi.getRooms(id) });

export function useChangeRole(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: 'admin' | 'member') => usersApi.changeRole(id, role),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.user(id) });
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useChangeStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isActive: boolean) => usersApi.changeStatus(id, isActive),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.user(id) });
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useSetUserRooms(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomIds: number[]) => usersApi.setRooms(id, roomIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.userRooms(id) });
      void qc.invalidateQueries({ queryKey: ['roomAccess'] });
    },
  });
}
