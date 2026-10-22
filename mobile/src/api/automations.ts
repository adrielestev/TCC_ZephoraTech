import { api } from "./client";
import { AutomationOperator, AutomationRule } from "../types";

export interface AutomationInput {
  name: string;
  source_sensor_id: number;
  operator: AutomationOperator;
  comparison_value: number;
  target_sensor_id: number;
  target_value: number;
  restore_previous?: boolean;
  is_enabled?: boolean;
  cooldown_seconds?: number;
}

export const automationsApi = {
  listForRoom: (roomId: number) =>
    api.get<{ automations: AutomationRule[] }>(`/rooms/${roomId}/automations`),

  create: (roomId: number, input: AutomationInput) =>
    api.post<{ automation: AutomationRule }>(`/rooms/${roomId}/automations`, input),

  update: (automationId: number, input: Partial<AutomationInput>) =>
    api.patch<{ automation: AutomationRule }>(`/automations/${automationId}`, input),

  remove: (automationId: number) => api.delete(`/automations/${automationId}`),
};
