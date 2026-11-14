import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/core/query/keys';
import type { Automation } from '@/core/types';
import { automationsApi, type NewAutomation } from './api';

export const useRoomAutomations = (roomId: number) =>
  useQuery({ queryKey: qk.automations(roomId), queryFn: () => automationsApi.listByRoom(roomId) });

export function useCreateAutomation(roomId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NewAutomation) => automationsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.automations(roomId) }),
  });
}

export function useRenameAutomation(roomId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => automationsApi.rename(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.automations(roomId) }),
  });
}

export function useDeleteAutomation(roomId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => automationsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.automations(roomId) }),
  });
}

/** Pausar/retomar com resposta imediata na tela. */
export function usePauseAutomation(roomId: number) {
  const qc = useQueryClient();
  const key = qk.automations(roomId);

  return useMutation({
    mutationFn: ({ id, paused }: { id: number; paused: boolean }) => automationsApi.setPaused(id, paused),
    onMutate: async ({ id, paused }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Automation[]>(key);
      qc.setQueryData<Automation[]>(key, (items) =>
        items?.map((a) => (a.id === id ? { ...a, isPaused: paused } : a)),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
