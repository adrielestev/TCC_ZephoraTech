import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useCommandDevice, useRemoveDevice, useRoomDevices } from "@/hooks/useDevices";
import { useRoomAutomations } from "@/hooks/useAutomations";
import { Device } from "@/types";
import { deviceStateLabel, deviceTypeIcons, deviceTypeLabels } from "@/utils/deviceRules";
import { Screen } from "@/components/Screen";
import { SurfaceCard } from "@/components/SurfaceCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { AnalogControl } from "@/components/AnalogControl";
import { colors, layout, radii, spacing, typography } from "@/theme/tokens";
import { confirmAction, showNotice } from "@/utils/confirm-action";

function DeviceCard({
  device,
  isAdmin,
  onCommand,
  pending,
  onEdit,
  onRemove,
  linkedAutomations,
}: {
  device: Device;
  isAdmin: boolean;
  onCommand: (value: number) => void;
  pending: boolean;
  onEdit: () => void;
  onRemove: () => void;
  linkedAutomations: string[];
}) {
  const value = device.desired_state ?? device.current_state ?? 0;
  const active = value > 0;
  const isOutput = device.direction === "output";
  const automationLocked = Boolean(device.automation_lock);
  return (
    <SurfaceCard>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: radii.field,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primarySoft,
          }}
        >
          <Ionicons
            name={deviceTypeIcons[device.type] as keyof typeof Ionicons.glyphMap}
            size={22}
            color={colors.primary}
          />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ ...typography.section, color: colors.ink }}>{device.name}</Text>
          <Text style={{ ...typography.caption, color: colors.muted }}>
            {deviceTypeLabels[device.type]} · {isOutput ? "Saída" : "Entrada"}
          </Text>
          {linkedAutomations.length > 0 && (
            <Text style={{ ...typography.caption, color: colors.muted }}>
              <Ionicons name="git-branch-outline" size={12} color={colors.muted} /> Em automação
            </Text>
          )}
          {automationLocked && (
            <Text style={{ ...typography.caption, color: colors.warning }}>
              Controlado por “{device.automation_lock?.name}”
            </Text>
          )}
        </View>
        {isAdmin && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar ${device.name}`}
            onPress={onEdit}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </Pressable>
        )}
      </View>
      <View
        style={{
          borderRadius: radii.field,
          backgroundColor: active ? colors.successSoft : colors.surfaceMuted,
          padding: spacing.md,
          alignItems: "center",
          gap: 3,
        }}
      >
        <Text style={{ ...typography.caption, color: colors.muted }}>
          {isOutput ? "Estado desejado" : "Leitura atual"}
        </Text>
        <Text style={{ ...typography.bodyStrong, color: active ? colors.success : colors.text }}>
          {deviceStateLabel(device.type, value, device.state_labels, device.value_unit || "°C")}
          {device.type === "pwm" ? ` (${value}%)` : ""}
        </Text>
      </View>
      {isOutput && device.type === "pwm" ? (
        <AnalogControl
          label={`Intensidade de ${device.name}`}
          value={value}
          pending={pending}
            disabled={automationLocked}
          onChange={onCommand}
        />
      ) : isOutput ? (
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: active, disabled: pending || automationLocked }}
          onPress={() => onCommand(active ? 0 : 1)}
          disabled={pending || automationLocked}
          style={({ pressed }) => ({
            minHeight: layout.minTouchTarget + 8,
            borderRadius: radii.button,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: active ? colors.primary : colors.surfaceMuted,
            borderWidth: active ? 0 : 1,
            borderColor: colors.border,
            opacity: pending || automationLocked || pressed ? 0.65 : 1,
          })}
        >
          <Text style={{ ...typography.bodyStrong, color: active ? colors.white : colors.text }}>
            {pending ? "Atualizando..." : automationLocked ? "Controlado pela automação" : active ? "Desligar" : "Ligar"}
          </Text>
        </Pressable>
      ) : (
        <Text style={{ ...typography.caption, textAlign: "center", color: colors.muted }}>
          Atualizado{" "}
          {device.updated_at ? new Date(device.updated_at).toLocaleString() : "aguardando leitura"}
        </Text>
      )}
      {isAdmin && (
        <View style={{ gap: spacing.xs, alignItems: "flex-start" }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Excluir dispositivo ${device.name}`}
            onPress={onRemove}
            style={{
              minHeight: layout.minTouchTarget,
              justifyContent: "center",
            }}
          >
            <Text style={{ ...typography.caption, color: colors.error }}>Excluir dispositivo</Text>
          </Pressable>
        </View>
      )}
    </SurfaceCard>
  );
}

export default function RoomDevicesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const { isAdmin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { data: devices, isLoading, isError, refetch } = useRoomDevices(roomId);
  const {
    data: automations,
    isError: automationsError,
    refetch: refetchAutomations,
  } = useRoomAutomations(roomId);
  const command = useCommandDevice(roomId);
  const remove = useRemoveDevice(roomId);

  async function handleRemove(device: Device) {
    if (isAdmin && automationsError) {
      showNotice(
        "Não foi possível verificar",
        "Tente novamente antes de excluir este dispositivo.",
      );
      void refetchAutomations();
      return;
    }
    const linkedAutomations = (automations ?? []).filter(
      (rule) => rule.source_sensor_id === device.id || rule.target_sensor_id === device.id,
    );
    if (linkedAutomations.length > 0) {
      showNotice(
        "Dispositivo em uso",
        `“${device.name}” está vinculado a ${linkedAutomations.length} automação(ões): ${linkedAutomations.map((rule) => rule.name).join(", ")}. Edite ou remova essas regras antes de excluir.`,
      );
      return;
    }
    if (!(await confirmAction("Excluir dispositivo", `Deseja excluir ${device.name}?`))) return;
    try {
      await remove.mutateAsync(device.id);
    } catch (reason) {
      const responseData = (
        reason as { response?: { data?: { message?: string; error?: string } } }
      ).response?.data;
      const apiMessage = responseData?.message ?? responseData?.error;
      showNotice(
        "Não foi possível excluir",
        apiMessage || "Verifique se há alguma automação vinculada a este dispositivo.",
      );
    }
  }

  if (isLoading) return <LoadingState label="Carregando dispositivos..." />;
  if (isError)
    return (
      <ErrorState message="Não foi possível carregar os dispositivos." onRetry={() => refetch()} />
    );

  return (
    <Screen scroll={false}>
      <FlatList
        data={devices ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          width: "100%",
          maxWidth: layout.contentMaxWidth,
          alignSelf: "center",
          padding: spacing.md,
          gap: spacing.md,
          paddingBottom: spacing.xl,
        }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md }}>
            <Text style={{ ...typography.title, color: colors.ink }}>Dispositivos</Text>
            {isAdmin && (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/(app)/rooms/${roomId}/devices/edit` as never)}
                style={({ pressed }) => ({
                  minHeight: layout.minTouchTarget + 6,
                  borderRadius: radii.button,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? colors.primaryPressed : colors.primary,
                })}
              >
                <Text style={{ ...typography.bodyStrong, color: colors.white }}>
                  Adicionar dispositivo
                </Text>
              </Pressable>
            )}
            {error && (
              <Text accessibilityRole="alert" style={{ color: colors.error }}>
                {error}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <DeviceCard
            device={item}
            isAdmin={isAdmin}
            pending={command.isPending && command.variables?.deviceId === item.id}
            onCommand={(value) => {
              setError(null);
              command.mutate(
                { deviceId: item.id, value },
                {
                  onError: (reason) => {
                    const apiMessage = (
                      reason as { response?: { data?: { error?: string } } }
                    ).response?.data?.error;
                    setError(apiMessage || "Não foi possível alterar o estado do dispositivo.");
                  },
                },
              );
            }}
            onEdit={() =>
              router.push(`/(app)/rooms/${roomId}/devices/edit?deviceId=${item.id}` as never)
            }
            onRemove={() => void handleRemove(item)}
            linkedAutomations={(automations ?? [])
              .filter(
                (rule) => rule.source_sensor_id === item.id || rule.target_sensor_id === item.id,
              )
              .map((rule) => rule.name)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="hardware-chip-outline"
            message="Nenhum dispositivo foi configurado nesta sala."
          />
        }
      />
    </Screen>
  );
}
