import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { automationsApi, AutomationInput } from "../api/automations";

export function useRoomAutomations(roomId: number, enabled = true) {
  return useQuery({
    queryKey: ["automations", roomId],
    queryFn: async () => (await automationsApi.listForRoom(roomId)).data.automations,
    enabled: enabled && Number.isInteger(roomId) && roomId > 0,
  });
}

function invalidateAutomations(queryClient: ReturnType<typeof useQueryClient>, roomId: number) {
  void queryClient.invalidateQueries({ queryKey: ["automations", roomId] });
}

export function useCreateAutomation(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AutomationInput) => automationsApi.create(roomId, input),
    onSuccess: () => invalidateAutomations(queryClient, roomId),
  });
}

export function useUpdateAutomation(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: AutomationInput & { id: number }) =>
      automationsApi.update(id, input),
    onSuccess: () => invalidateAutomations(queryClient, roomId),
  });
}

export function useRemoveAutomation(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (automationId: number) => automationsApi.remove(automationId),
    onSuccess: () => invalidateAutomations(queryClient, roomId),
  });
}
