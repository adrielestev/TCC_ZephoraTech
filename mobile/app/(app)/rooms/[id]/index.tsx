import { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Href, router, useLocalSearchParams } from "expo-router";
import { useRemoveRoom, useRoom } from "../../../../src/hooks/useRooms";
import { useAuth } from "../../../../src/context/AuthContext";
import { useRoomSensors } from "../../../../src/hooks/useSensors";
import { getRoomStatus, getRoomStatusLabel } from "../../../../src/utils/roomStatus";
import { resolveMediaUrl } from "../../../../src/api/client";
import { Screen } from "../../../../src/components/Screen";
import { SurfaceCard } from "../../../../src/components/SurfaceCard";
import { ImageViewerModal } from "../../../../src/components/ImageViewerModal";
import { colors, layout, radii, spacing, typography } from "../../../../src/theme/tokens";
import { LoadingState } from "../../../../src/components/LoadingState";
import { ErrorState } from "../../../../src/components/ErrorState";
import { confirmAction } from "../../../../src/utils/confirm-action";

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const { isAdmin } = useAuth();
  const removeRoom = useRemoveRoom();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
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

  async function handleDelete() {
    if (!(await confirmAction("Excluir sala", "Esta ação não pode ser desfeita."))) return;
    try {
      await removeRoom.mutateAsync(roomId);
      router.replace("/(app)");
    } catch {
      setDeleteError("Não foi possível excluir a sala.");
    }
  }

  return (
    <Screen contentContainerStyle={{ gap: spacing.md }}>
      <SurfaceCard>
        <Text style={{ ...typography.display, color: colors.ink }}>{room.name}</Text>
        <Text style={{ ...typography.body, color: colors.muted }}>{room.classroom_code}</Text>
        <View
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: spacing.sm,
            paddingVertical: 5,
            borderRadius: radii.pill,
            backgroundColor:
              getRoomStatus(room.last_seen_at) === "online"
                ? colors.successSoft
                : colors.warningSoft,
          }}
        >
          <Text
            style={{
              ...typography.caption,
              color:
                getRoomStatus(room.last_seen_at) === "online" ? colors.success : colors.warning,
            }}
          >
            {getRoomStatusLabel(getRoomStatus(room.last_seen_at))}
          </Text>
        </View>
        {room.last_seen_at && (
          <Text style={{ ...typography.caption, color: colors.muted }}>
            Última comunicação: {new Date(room.last_seen_at).toLocaleString()}
          </Text>
        )}
        <Text style={{ ...typography.bodyStrong, color: colors.text }}>
          {sensors?.length ?? 0} dispositivo(s) vinculado(s)
        </Text>
        {isAdmin && room.has_device_credential === false && (
          <View
            style={{
              padding: spacing.sm,
              borderRadius: radii.field,
              backgroundColor: colors.warningSoft,
            }}
          >
            <Text style={{ ...typography.body, color: colors.warning }}>
              O ESP32 desta sala ainda não tem credencial. Gere uma em Editar sala.
            </Text>
          </View>
        )}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {[room.room_photo_1, room.room_photo_2, room.room_photo_3].map((photo, index) =>
            photo ? (
              <Pressable
                key={photo}
                accessibilityRole="button"
                accessibilityLabel={`Ampliar foto ${index + 1} da sala`}
                onPress={() => setSelectedPhoto(resolveMediaUrl(photo))}
                style={({ pressed }) => ({
                  width: 88,
                  height: 64,
                  maxWidth: "30%",
                  borderRadius: radii.field,
                  overflow: "hidden",
                  opacity: pressed ? 0.78 : 1,
                })}
              >
                <Image
                  source={{ uri: resolveMediaUrl(photo) ?? undefined }}
                  accessibilityLabel={`Foto ${index + 1} da sala`}
                  style={{ width: "100%", height: "100%" }}
                />
              </Pressable>
            ) : null,
          )}
        </View>

        {actions.map((action) => (
          <Pressable
            key={action.href}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={() => router.push(action.href as Href)}
            style={({ pressed, hovered }) => ({
              minHeight: layout.minTouchTarget,
              borderWidth: 1,
              borderColor: hovered || pressed ? colors.borderStrong : colors.border,
              borderRadius: radii.button,
              paddingHorizontal: spacing.md,
              justifyContent: "center",
              backgroundColor: hovered ? colors.surfaceAccent : colors.surfaceMuted,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ ...typography.bodyStrong, color: colors.text }}>{action.label}</Text>
          </Pressable>
        ))}
        {isAdmin && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Excluir sala"
            accessibilityState={{ disabled: removeRoom.isPending }}
            onPress={handleDelete}
            disabled={removeRoom.isPending}
            hitSlop={8}
          >
            <Text
              style={{
                ...typography.bodyStrong,
                color: colors.error,
                textDecorationLine: "underline",
              }}
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
        <ImageViewerModal
          visible={selectedPhoto !== null}
          uri={selectedPhoto}
          label="Foto ampliada da sala"
          onClose={() => setSelectedPhoto(null)}
        />
      </SurfaceCard>
    </Screen>
  );
}
