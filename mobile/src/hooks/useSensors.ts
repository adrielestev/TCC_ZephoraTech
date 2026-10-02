import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sensorsApi } from "../api/sensors";
import { Sensor } from "../types";
import { API_REFETCH_INTERVAL_MS } from "../config/constants";

export function useRoomSensors(roomId: number) {
  return useQuery({
    queryKey: ["sensors", roomId],
    queryFn: async () => {
      const { data } = await sensorsApi.list();
      return data.sensors.filter((sensor) => sensor.room_id === roomId);
    },
    enabled: !!roomId,
    refetchInterval: API_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useSensor(sensorId: number) {
  return useQuery({
    queryKey: ["sensor", sensorId],
    queryFn: async () => (await sensorsApi.get(sensorId)).data.sensor,
    enabled: !!sensorId,
  });
}

export function useCommandSensor(roomId: number) {
  const queryClient = useQueryClient();
  const queryKey = ["sensors", roomId];

  return useMutation({
    mutationFn: ({ sensorId, state }: { sensorId: number; state: number }) =>
      sensorsApi.command(sensorId, state),

    onMutate: async ({ sensorId, state }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Sensor[]>(queryKey);

      queryClient.setQueryData<Sensor[]>(queryKey, (old) =>
        old?.map((s) => (s.id === sensorId ? { ...s, current_state: state } : s)),
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useCreateSensor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sensorsApi.create,
    onSuccess: (_data, sensor) => {
      queryClient.invalidateQueries({ queryKey: ["sensors", sensor.room_id] });
    },
  });
}

export function useUpdateSensor(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sensorId, data }: { sensorId: number; data: Partial<Sensor> }) =>
      sensorsApi.update(sensorId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sensors", roomId] }),
  });
}

export function useRemoveSensor(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sensorsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sensors", roomId] }),
  });
}
