import { useState } from "react";
import { View, Text, FlatList, Switch, Pressable, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../../../src/context/AuthContext";
import {
  useRemoveSensor,
  useRoomSensors,
  useCommandSensor,
} from "../../../../../src/hooks/useSensors";
import { ROOM_SENSOR_REFETCH_INTERVAL_MS } from "../../../../../src/config/constants";
import {
  colors,
  layout,
  radii,
  shadows,
  spacing,
  typography,
} from "../../../../../src/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { IconButton } from "../../../../../src/components/IconButton";
import { LoadingState } from "../../../../../src/components/LoadingState";
import { ErrorState } from "../../../../../src/components/ErrorState";
import { EmptyState } from "../../../../../src/components/EmptyState";
import { AnalogControl } from "../../../../../src/components/AnalogControl";
import { confirmAction } from "../../../../../src/utils/confirm-action";
import { FeedbackMessage } from "../../../../../src/components/FeedbackMessage";
import { Sensor } from "../../../../../src/types";
import {
  getDefaultDeviceStateLabels,
  sensorTypeDisplayNames,
  sensorTypeIcons,
} from "../../../../../src/utils/sensorRules";

function getStateLabel(sensor: Sensor, active: boolean) {
  const defaults = getDefaultDeviceStateLabels(sensor.type);
  return active
    ? sensor.state_labels?.active || defaults.active
    : sensor.state_labels?.inactive || defaults.inactive;
}

export default function RoomDevicesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const { isAdmin } = useAuth();
  const { data: sensors, isLoading, isError, isRefetching, refetch } = useRoomSensors(
    roomId,
    ROOM_SENSOR_REFETCH_INTERVAL_MS,
  );
  const commandSensor = useCommandSensor(roomId);
  const removeSensor = useRemoveSensor(roomId);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  async function handleRefresh() {
    setIsManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  }

  const isSensorPending = (sensorId: number) =>
    commandSensor.isPending && commandSensor.variables?.sensorId === sensorId;

  async function handleRemove(sensorId: number) {
    if (!(await confirmAction("Excluir dispositivo", "Esta ação não pode ser desfeita."))) return;
    removeSensor.mutate(sensorId, {
      onError: () => setMutationError("Não foi possível excluir o dispositivo."),
    });
  }

  function handleCommand(sensorId: number, state: number) {
    setMutationError(null);
    commandSensor.reset();
    commandSensor.mutate(
      { sensorId, state },
      {
        onError: () =>
          setMutationError(
            "Não foi possível enviar o comando. Verifique se o dispositivo está online.",
          ),
      },
    );
  }

  if (isLoading) return <LoadingState label="Carregando dispositivos..." />;
  if (isError) {
    return (
      <ErrorState message="Não foi possível carregar os dispositivos." onRetry={() => refetch()} />
    );
  }
  const deviceCount = sensors?.length ?? 0;

  return (
    <LinearGradient colors={[colors.backgroundTop, colors.backgroundBottom]} style={{ flex: 1 }}>
      <FlatList
        data={sensors}
        refreshControl={
          <RefreshControl
            refreshing={isManualRefreshing && isRefetching}
            onRefresh={handleRefresh}
          />
        }
        keyExtractor={(sensor) => String(sensor.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 32 }}
        renderItem={({ item }) => {
          const isInput = item.direction === "INPUT";
          const isDigital = item.type_of_control === "DIGITAL";
          const active =
            item.type === "TEMPERATURE" ||
            (isDigital ? item.current_state === 1 : item.current_state > 0);
          const statusColor =
            item.type === "TEMPERATURE" ? colors.primary : active ? colors.success : colors.muted;
          const statusBackground =
            item.type === "TEMPERATURE"
              ? colors.primarySoft
              : active
                ? colors.successSoft
                : colors.surfaceMuted;
          const temperatureValue = item.current_state.toFixed(1).replace(".", ",");
          const statusLabel =
            item.type === "TEMPERATURE" ? `${temperatureValue} °C` : getStateLabel(item, active);

          return (
            <View
              style={{
                width: "100%",
                maxWidth: layout.contentMaxWidth,
                alignSelf: "center",
                gap: spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radii.card,
                padding: spacing.lg,
                backgroundColor: colors.surface,
                ...shadows.card,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: radii.field,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primarySoft,
                  }}
                >
                  <Ionicons
                    name={sensorTypeIcons[item.type] as keyof typeof Ionicons.glyphMap}
                    size={23}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ ...typography.section, color: colors.ink }}>{item.name}</Text>
                  <Text style={{ ...typography.caption, color: colors.muted }}>
                    {sensorTypeDisplayNames[item.type]} · {isInput ? "Leitura" : "Controle"}
                  </Text>
                </View>
                {isAdmin && (
                  <View style={{ flexDirection: "row", gap: spacing.xs }}>
                    <IconButton
                      icon="create-outline"
                      label={`Editar ${item.name}`}
                      onPress={() =>
                        router.push(
                          `/(app)/rooms/${roomId}/devices/edit?sensorId=${item.id}` as never,
                        )
                      }
                    />
                    <IconButton
                      icon="trash-outline"
                      label={`Excluir ${item.name}`}
                      destructive
                      onPress={() => handleRemove(item.id)}
                    />
                  </View>
                )}
              </View>

              {isInput ? (
                <View
                  accessibilityLabel={`Leitura atual de ${item.name}: ${statusLabel}`}
                  style={{
                    minHeight: 64,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radii.field,
                    backgroundColor: statusBackground,
                  }}
                >
                  <View style={{ gap: 2 }}>
                    <Text style={{ ...typography.caption, color: colors.muted }}>
                      {item.type === "TEMPERATURE" ? "Temperatura atual" : "Leitura atual"}
                    </Text>
                    <Text style={{ ...typography.bodyStrong, color: statusColor }}>
                      {statusLabel}
                    </Text>
                  </View>
                  <View style={{ alignItems: "center", gap: 2 }}>
                    <Ionicons
                      name={
                        item.type === "TEMPERATURE"
                          ? "thermometer-outline"
                          : active
                            ? "radio-button-on"
                            : "radio-button-off"
                      }
                      size={24}
                      color={statusColor}
                    />
                    <Text style={{ ...typography.caption, color: colors.muted }}>
                      {item.type === "TEMPERATURE" ? "°C" : `Valor ${item.current_state}`}
                    </Text>
                  </View>
                </View>
              ) : isDigital ? (
                <View
                  style={{
                    minHeight: 64,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.field,
                    backgroundColor: statusBackground,
                  }}
                >
                  <View style={{ gap: 2 }}>
                    <Text style={{ ...typography.caption, color: colors.muted }}>Estado atual</Text>
                    <Text style={{ ...typography.bodyStrong, color: statusColor }}>
                      {statusLabel}
                    </Text>
                  </View>
                  <Switch
                    accessibilityLabel={`${active ? "Desligar" : "Ligar"} ${item.name}`}
                    accessibilityState={{
                      disabled: isSensorPending(item.id),
                      checked: active,
                    }}
                    value={active}
                    disabled={isSensorPending(item.id)}
                    onValueChange={(value) => handleCommand(item.id, value ? 1 : 0)}
                  />
                </View>
              ) : (
                <AnalogControl
                  label={item.name}
                  value={item.current_state}
                  min={Number(item.device_settings?.min_percent ?? 0)}
                  max={Number(item.device_settings?.max_percent ?? 100)}
                  step={Number(item.device_settings?.step_percent ?? 5)}
                  pending={isSensorPending(item.id)}
                  onChange={(nextState) => handleCommand(item.id, nextState)}
                />
              )}
            </View>
          );
        }}
        ListHeaderComponentStyle={{
          width: "100%",
          maxWidth: layout.contentMaxWidth,
          alignSelf: "center",
        }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.xs }}>
            <View style={{ gap: spacing.xs }}>
              <Text style={{ ...typography.body, color: colors.muted }}>
                {deviceCount} {deviceCount === 1 ? "dispositivo" : "dispositivos"} nesta sala
              </Text>
            </View>
            {isAdmin && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Criar novo dispositivo"
                onPress={() => router.push(`/(app)/rooms/${roomId}/devices/edit` as never)}
                style={({ pressed, hovered }) => ({
                  backgroundColor: colors.primary,
                  minHeight: layout.minTouchTarget + 4,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.button,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: spacing.sm,
                  opacity: pressed ? 0.86 : hovered ? 0.94 : 1,
                  ...shadows.button,
                })}
              >
                <Text style={{ ...typography.bodyStrong, color: colors.white }}>
                  Novo dispositivo
                </Text>
              </Pressable>
            )}
          </View>
        }
        ListFooterComponent={
          commandSensor.error ? (
            <FeedbackMessage message="Não foi possível enviar o comando. Verifique se o dispositivo está online." />
          ) : mutationError ? (
            <FeedbackMessage message={mutationError} />
          ) : commandSensor.isSuccess ? (
            <FeedbackMessage message="Estado atualizado." variant="success" />
          ) : null
        }
        ListEmptyComponent={
          <EmptyState icon="hardware-chip-outline" message="Nenhum dispositivo cadastrado." />
        }
      />
    </LinearGradient>
  );
}
