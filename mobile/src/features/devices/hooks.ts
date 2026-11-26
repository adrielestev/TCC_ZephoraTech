// src/features/devices/hooks.ts -- Fornece consultas e ações de dispositivos vinculadas ao cache de dados.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/core/query/keys';
import type { Device, DeviceExecutionConfig, DeviceState } from '@/core/types';
import { devicesApi } from './api';

/** Atualiza a cada 5 s para refletir o que o ESP32 confirmou. */
export const useRoomDevices = (roomId: number) =>
  useQuery({
    queryKey: qk.devices(roomId),
    queryFn: () => devicesApi.listByRoom(roomId),
    refetchInterval: 5000,
  });

/** Liga/desliga com resposta imediata na tela (otimista) e volta atrás se a API recusar. */
export function useSetDeviceState(roomId: number) {
  const qc = useQueryClient();
  const key = qk.devices(roomId);

  return useMutation({
    mutationFn: ({ id, state }: { id: number; state: DeviceState }) =>
      devicesApi.setState(id, state),
    onMutate: async ({ id, state }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Device[]>(key);
      qc.setQueryData<Device[]>(key, (devices) =>
        devices?.map((d) => (d.id === id ? { ...d, desiredState: state } : d)),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: number;
      name?: string;
      roomId?: number;
      executionConfig?: DeviceExecutionConfig;
    }) => devicesApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['devices'] });
      void qc.invalidateQueries({ queryKey: qk.rooms });
    },
  });
}

export function useRemoveDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => devicesApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['devices'] });
      void qc.invalidateQueries({ queryKey: ['automations'] });
      void qc.invalidateQueries({ queryKey: qk.rooms });
      void qc.invalidateQueries({ queryKey: qk.esp32List });
    },
  });
}
