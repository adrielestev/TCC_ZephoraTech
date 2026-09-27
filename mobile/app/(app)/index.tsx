import { Text, FlatList, Pressable, RefreshControl } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useRooms } from "../../src/hooks/useRooms";
import { useAuth } from "../../src/context/AuthContext";
import { getRoomStatus, getRoomStatusLabel } from "../../src/utils/roomStatus";
import { colors, radii, spacing } from "../../src/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { LoadingState } from "../../src/components/LoadingState";
import { ErrorState } from "../../src/components/ErrorState";
import { EmptyState } from "../../src/components/EmptyState";

export default function RoomsListScreen() {
  const { data: rooms, isLoading, isError, isRefetching, refetch } = useRooms();
  const { isAdmin } = useAuth();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  async function handleRefresh() {
    setIsManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Carregando salas..." />;
  }

  if (isError) {
    return <ErrorState message="Não foi possível carregar as salas." onRetry={() => refetch()} />;
  }

  return (
    <LinearGradient colors={[colors.backgroundTop, colors.backgroundBottom]} style={{ flex: 1 }}>
      <FlatList
        data={rooms}
        refreshControl={
          <RefreshControl
            refreshing={isManualRefreshing && isRefetching}
            onRefresh={handleRefresh}
          />
        }
        ListHeaderComponent={
          isAdmin ? (
            <Pressable
              onPress={() => router.push("/(app)/rooms/create")}
              style={{
                backgroundColor: colors.primary,
                padding: 15,
                borderRadius: radii.button,
                alignItems: "center",
                marginBottom: spacing.sm,
              }}
            >
              <Text style={{ color: colors.white, fontWeight: "800" }}>Nova sala</Text>
            </Pressable>
          ) : null
        }
        keyExtractor={(room) => String(room.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(app)/rooms/${item.id}`)}
            style={({ pressed }) => ({
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.card,
              padding: spacing.md,
              backgroundColor: colors.surface,
              opacity: pressed ? 0.76 : 1,
              shadowColor: "#31516D",
              shadowOpacity: 0.12,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            })}
          >
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.ink }}>{item.name}</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>{item.classroom_code}</Text>
            <Text
              style={{
                color: getRoomStatus(item.last_seen_at) === "online" ? colors.success : "#A15C00",
                fontWeight: "700",
                marginTop: 8,
              }}
            >
              {getRoomStatusLabel(getRoomStatus(item.last_seen_at))}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState icon="business-outline" message="Nenhuma sala ainda." />}
      />
    </LinearGradient>
  );
}
