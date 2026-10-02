import { Text, FlatList, Pressable, RefreshControl, View } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useRooms } from "../../src/hooks/useRooms";
import { useAuth } from "../../src/context/AuthContext";
import { getRoomStatus, getRoomStatusLabel } from "../../src/utils/roomStatus";
import { colors, layout, radii, shadows, spacing, typography } from "../../src/theme/tokens";
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
        ListHeaderComponentStyle={{
          width: "100%",
          maxWidth: layout.contentMaxWidth,
          alignSelf: "center",
        }}
        ListHeaderComponent={
          isAdmin ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Criar nova sala"
              onPress={() => router.push("/(app)/rooms/create")}
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
              <Text style={{ ...typography.bodyStrong, color: colors.white }}>Nova sala</Text>
            </Pressable>
          ) : null
        }
        keyExtractor={(room) => String(room.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir sala ${item.name}`}
            onPress={() => router.push(`/(app)/rooms/${item.id}`)}
            style={({ pressed, hovered }) => ({
              width: "100%",
              maxWidth: layout.contentMaxWidth,
              alignSelf: "center",
              borderWidth: 1,
              borderColor: hovered || pressed ? colors.borderStrong : colors.border,
              borderRadius: radii.card,
              padding: spacing.lg,
              backgroundColor: hovered ? colors.surfaceAccent : colors.surface,
              transform: [{ scale: pressed ? 0.985 : 1 }],
              ...shadows.card,
            })}
          >
            <View style={{ gap: spacing.xs }}>
              <Text style={{ ...typography.section, color: colors.ink }}>{item.name}</Text>
              <Text style={{ ...typography.caption, color: colors.muted }}>
                {item.classroom_code}
              </Text>
            </View>
            <View
              style={{
                alignSelf: "flex-start",
                marginTop: spacing.sm,
                paddingHorizontal: spacing.sm,
                paddingVertical: 5,
                borderRadius: radii.pill,
                backgroundColor:
                  getRoomStatus(item.last_seen_at) === "online"
                    ? colors.successSoft
                    : colors.warningSoft,
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color:
                    getRoomStatus(item.last_seen_at) === "online" ? colors.success : colors.warning,
                }}
              >
                {getRoomStatusLabel(getRoomStatus(item.last_seen_at))}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState icon="business-outline" message="Nenhuma sala ainda." />}
      />
    </LinearGradient>
  );
}
