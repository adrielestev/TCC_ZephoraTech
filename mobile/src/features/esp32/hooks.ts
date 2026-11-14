import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/core/query/keys';
import { esp32Api, type DeviceRegistration } from './api';

export const useEsp32List = () =>
  useQuery({ queryKey: qk.esp32List, queryFn: esp32Api.list, refetchInterval: 10_000 });

/** `poll` liga a consulta periódica (passo "aguardando o ESP32"). */
export const useEsp32 = (id: number | null, poll = false) =>
  useQuery({
    queryKey: qk.esp32(id ?? 0),
    queryFn: () => esp32Api.get(id as number),
    enabled: id !== null,
    refetchInterval: poll ? 3000 : false,
  });

export function useRegisterEsp32() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: esp32Api.register,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.esp32List }),
  });
}

export function useRegisterEsp32Devices(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (devices: DeviceRegistration[]) => esp32Api.registerDevices(id, devices),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.esp32List });
      void qc.invalidateQueries({ queryKey: qk.esp32(id) });
      void qc.invalidateQueries({ queryKey: qk.rooms });
      void qc.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useRemoveEsp32() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => esp32Api.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.esp32List });
      void qc.invalidateQueries({ queryKey: qk.rooms });
      void qc.invalidateQueries({ queryKey: ['devices'] });
      void qc.invalidateQueries({ queryKey: ['automations'] });
    },
  });
}
