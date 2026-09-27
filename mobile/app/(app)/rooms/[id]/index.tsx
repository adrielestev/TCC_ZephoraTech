import { useState } from "react";
import { Alert, View, Text, Pressable, Image } from "react-native";
import { Href, router, useLocalSearchParams } from "expo-router";
import { useRemoveRoom, useRoom } from "../../../../src/hooks/useRooms";
import { useAuth } from "../../../../src/context/AuthContext";
import { useRoomSensors } from "../../../../src/hooks/useSensors";
import { getRoomStatus, getRoomStatusLabel } from "../../../../src/utils/roomStatus";
import { resolveMediaUrl } from "../../../../src/api/client";
import { Screen } from "../../../../src/components/Screen";
import { SurfaceCard } from "../../../../src/components/SurfaceCard";
import { colors, radii, spacing } from "../../../../src/theme/tokens";
import { LoadingState } from "../../../../src/components/LoadingState";
import { ErrorState } from "../../../../src/components/ErrorState";

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const { isAdmin } = useAuth();
  const removeRoom = useRemoveRoom();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { data: room, isLoading, isError, refetch } = useRoom(roomId);
  const { data: sensors } = useRoomSensors(roomId);

  if (isLoading) {
    return <LoadingState label="Carregando sala..." />;
  }

  if (isError || !room) {
    return <ErrorState message="Não foi possível carregar esta sala." onRetry={() => refetch()} />;
  }

  const actions = [
    { label: "Dispositivos", href: `/(app)/rooms/${roomId}/devices` },
    ...(isAdmin
      ? [
          { label: "Colaboradores", href: `/(app)/rooms/${roomId}/collaborators` },
          { label: "Editar sala", href: `/(app)/rooms/${roomId}/edit` },
        ]
      : []),
  ] as const;

  function handleDelete() {
    Alert.alert("Excluir sala", "Esta ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await removeRoom.mutateAsync(roomId);
            router.replace("/(app)");
          } catch {
            setDeleteError("Não foi possível excluir a sala.");
          }
        },
      },
    ]);
  }

  return (
    <Screen contentContainerStyle={{ gap: spacing.md }}>
      <SurfaceCard>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink }}>{room.name}</Text>
        <Text style={{ color: colors.muted }}>{room.classroom_code}</Text>
        <Text
          style={{
            color: getRoomStatus(room.last_seen_at) === "online" ? colors.success : "#A15C00",
            fontWeight: "800",
          }}
        >
          {getRoomStatusLabel(getRoomStatus(room.last_seen_at))}
        </Text>
        {room.last_seen_at && (
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            Última comunicação: {new Date(room.last_seen_at).toLocaleString()}
          </Text>
        )}
        <Text style={{ color: colors.text, fontWeight: "700" }}>
          {sensors?.length ?? 0} dispositivo(s) vinculado(s)
        </Text>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {[room.room_photo_1, room.room_photo_2, room.room_photo_3].map((photo, index) =>
            photo ? (
              <Image
                key={photo}
                source={{ uri: resolveMediaUrl(photo) ?? undefined }}
                accessibilityLabel={`Foto ${index + 1} da sala`}
                style={{ width: 88, height: 64, borderRadius: radii.field }}
              />
            ) : null,
          )}
        </View>

        {actions.map((action) => (
          <Pressable
            key={action.href}
            onPress={() => router.push(action.href as Href)}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.button,
              padding: 16,
              backgroundColor: "rgba(255,255,255,0.7)",
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "800" }}>{action.label}</Text>
          </Pressable>
        ))}
        {isAdmin && (
          <Pressable onPress={handleDelete} disabled={removeRoom.isPending}>
            <Text
              style={{ color: colors.error, fontWeight: "800", textDecorationLine: "underline" }}
            >
              Excluir sala
            </Text>
          </Pressable>
        )}
        {deleteError && (
          <Text accessibilityRole="alert" style={{ color: colors.error, fontWeight: "600" }}>
            {deleteError}
          </Text>
        )}
      </SurfaceCard>
    </Screen>
  );
}
