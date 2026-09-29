import { View, Text, FlatList, Switch, Pressable, RefreshControl } from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../../src/context/AuthContext";
import {
  useRemoveSensor,
  useRoomSensors,
  useCommandSensor,
} from "../../../../src/hooks/useSensors";
import { colors, radii, spacing } from "../../../../src/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { IconButton } from "../../../../src/components/IconButton";
import { LoadingState } from "../../../../src/components/LoadingState";
import { ErrorState } from "../../../../src/components/ErrorState";
import { EmptyState } from "../../../../src/components/EmptyState";
import { AnalogControl } from "../../../../src/components/AnalogControl";
import { confirmAction } from "../../../../src/utils/confirm-action";

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
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.card,
              padding: 16,
              backgroundColor: colors.surface,
              shadowOpacity: 0.12,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: colors.ink }}>{item.name}</Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>{item.type}</Text>
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
              <Text style={{ color: colors.muted, fontWeight: "700" }}>
                Leitura: {item.current_state}
              </Text>
            ) : item.type_of_control === "DIGITAL" ? (
              <Switch
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
        ListHeaderComponent={
          isAdmin ? (
            <Pressable
              onPress={() => router.push(`/(app)/rooms/${roomId}/devices/edit` as never)}
              style={{
                backgroundColor: colors.primary,
                padding: 15,
                borderRadius: radii.button,
                alignItems: "center",
                marginBottom: spacing.sm,
              }}
            >
              <Text style={{ color: colors.white, fontWeight: "800" }}>Novo dispositivo</Text>
            </Pressable>
          ) : null
        }
        ListFooterComponent={
          commandSensor.error ? (
            <Text accessibilityRole="alert" style={{ color: colors.error, paddingTop: 8 }}>
              Não foi possível enviar o comando. Verifique se o dispositivo está online.
            </Text>
          ) : mutationError ? (
            <Text accessibilityRole="alert" style={{ color: colors.error, paddingTop: 8 }}>
              {mutationError}
            </Text>
          ) : commandSensor.isSuccess ? (
            <Text style={{ color: colors.success, paddingTop: 8, fontWeight: "700" }}>
              Estado atualizado.
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState icon="hardware-chip-outline" message="Nenhum dispositivo cadastrado." />
        }
      />
    </LinearGradient>
  );
}
