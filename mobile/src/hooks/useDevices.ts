import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { devicesApi, DeviceInput, DeviceUpdate } from "../api/devices";
import { Device } from "../types";
import { API_REFETCH_INTERVAL_MS } from "../config/constants";

export function useRoomDevices(roomId: number) {
  return useQuery({
    queryKey: ["devices", roomId],
    queryFn: async () => (await devicesApi.listForRoom(roomId)).data.devices,
    enabled: Number.isInteger(roomId) && roomId > 0,
    refetchInterval: API_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useDevice(roomId: number, deviceId: number) {
  return useQuery({
    queryKey: ["devices", roomId, deviceId],
    queryFn: async () => {
      const devices = (await devicesApi.listForRoom(roomId)).data.devices;
      const device = devices.find((item) => item.id === deviceId);
      if (!device) throw new Error("Dispositivo não encontrado nesta sala.");
      return device;
    },
    enabled: Number.isInteger(roomId) && roomId > 0 && Number.isInteger(deviceId) && deviceId > 0,
  });
}

export function useCommandDevice(roomId: number) {
  const queryClient = useQueryClient();
  const queryKey = ["devices", roomId];

  return useMutation({
    mutationFn: ({ deviceId, value }: { deviceId: number; value: number }) =>
      devicesApi.command(deviceId, value),
    onMutate: async ({ deviceId, value }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Device[]>(queryKey);
      queryClient.setQueryData<Device[]>(queryKey, (current) =>
        current?.map((device) =>
          device.id === deviceId ? { ...device, desired_state: value } : device,
        ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

function invalidateRoomDevices(queryClient: ReturnType<typeof useQueryClient>, roomId: number) {
  void queryClient.invalidateQueries({ queryKey: ["devices", roomId] });
  void queryClient.invalidateQueries({ queryKey: ["rooms", roomId] });
}

export function useCreateDevice(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeviceInput) => devicesApi.create(roomId, input),
    onSuccess: () => invalidateRoomDevices(queryClient, roomId),
  });
}

export function useUpdateDevice(roomId: number, deviceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeviceUpdate) => devicesApi.update(deviceId, input),
    onSuccess: () => {
      invalidateRoomDevices(queryClient, roomId);
      void queryClient.invalidateQueries({ queryKey: ["devices", roomId, deviceId] });
    },
  });
}

export function useRemoveDevice(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: number) => devicesApi.remove(deviceId),
    onSuccess: () => invalidateRoomDevices(queryClient, roomId),
  });
}
