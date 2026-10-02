import { View, Text, FlatList, Switch, Pressable, RefreshControl } from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../../src/context/AuthContext";
import {
  useRemoveSensor,
  useRoomSensors,
  useCommandSensor,
} from "../../../../src/hooks/useSensors";
import { colors, layout, radii, shadows, spacing, typography } from "../../../../src/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { IconButton } from "../../../../src/components/IconButton";
import { LoadingState } from "../../../../src/components/LoadingState";
import { ErrorState } from "../../../../src/components/ErrorState";
import { EmptyState } from "../../../../src/components/EmptyState";
import { AnalogControl } from "../../../../src/components/AnalogControl";
import { confirmAction } from "../../../../src/utils/confirm-action";
import { FeedbackMessage } from "../../../../src/components/FeedbackMessage";

export default function RoomDevicesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const { isAdmin } = useAuth();

  const { data: sensors, isLoading, isError, isRefetching, refetch } = useRoomSensors(roomId);
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

  function handleAnalogChange(sensorId: number, currentState: number, delta: number) {
    setMutationError(null);
    commandSensor.reset();
    const nextState = Math.max(0, Math.min(100, currentState + delta));
    commandSensor.mutate(
      { sensorId, state: nextState },
      {
        onError: () =>
          setMutationError(
            "Não foi possível enviar o comando. Verifique se o dispositivo está online.",
          ),
      },
    );
  }

  if (isLoading) {
    return <LoadingState label="Carregando dispositivos..." />;
  }

  if (isError) {
    return (
      <ErrorState message="Não foi possível carregar os dispositivos." onRetry={() => refetch()} />
    );
  }

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
        renderItem={({ item }) => (
          <View
            style={{
              width: "100%",
              maxWidth: layout.contentMaxWidth,
              alignSelf: "center",
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.card,
              padding: spacing.lg,
              backgroundColor: colors.surface,
              ...shadows.card,
            }}
          >
            <View style={{ flex: 1, minWidth: 150, gap: spacing.xs }}>
              <Text style={{ ...typography.section, color: colors.ink }}>{item.name}</Text>
              <Text style={{ ...typography.caption, color: colors.muted }}>{item.type}</Text>
              {isAdmin && (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
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

            {item.direction === "INPUT" ? (
              <Text style={{ ...typography.bodyStrong, color: colors.muted }}>
                Leitura: {item.current_state}
              </Text>
            ) : item.type_of_control === "DIGITAL" ? (
              <Switch
                accessibilityLabel={`Ativar ou desativar ${item.name}`}
                accessibilityState={{
                  disabled: isSensorPending(item.id),
                  checked: item.current_state === 1,
                }}
                value={item.current_state === 1}
                disabled={isSensorPending(item.id)}
                onValueChange={(value) => {
                  setMutationError(null);
                  commandSensor.reset();
                  commandSensor.mutate(
                    { sensorId: item.id, state: value ? 1 : 0 },
                    {
                      onError: () =>
                        setMutationError(
                          "Não foi possível enviar o comando. Verifique se o dispositivo está online.",
                        ),
                    },
                  );
                }}
              />
            ) : (
              <AnalogControl
                label={item.name}
                value={item.current_state}
                pending={isSensorPending(item.id)}
                onChange={(nextState) =>
                  handleAnalogChange(item.id, item.current_state, nextState - item.current_state)
                }
              />
            )}
          </View>
        )}
        ListHeaderComponentStyle={{
          width: "100%",
          maxWidth: layout.contentMaxWidth,
          alignSelf: "center",
        }}
        ListHeaderComponent={
          isAdmin ? (
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
          ) : null
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
