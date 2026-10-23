import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useDeleteRoomPhoto, useRoom, useUpdateRoom, useUploadRoomPhoto } from "@/hooks/useRooms";
import { RoomPhotoSlot } from "@/types";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SurfaceCard } from "@/components/SurfaceCard";
import { DeviceCredentialSection } from "@/components/DeviceCredentialSection";
import { AuthenticatedImage } from "@/components/AuthenticatedImage";
import { colors, radii, spacing, typography } from "@/theme/tokens";
import { IconButton } from "@/components/IconButton";
import { FeedbackMessage } from "@/components/FeedbackMessage";
import { confirmAction } from "@/utils/confirm-action";
import { useAuth } from "@/context/AuthContext";

export default function RoomEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const { isAdmin } = useAuth();

  const { data: room, isLoading, isError, refetch } = useRoom(roomId);
  const updateRoom = useUpdateRoom(roomId);
  const uploadPhoto = useUploadRoomPhoto(roomId);
  const deletePhoto = useDeleteRoomPhoto(roomId);

  const [name, setName] = useState(room?.name ?? "");
  const [macAddress, setMacAddress] = useState(room?.mac_address ?? "");
  const [error, setError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const initializedRoom = useRef<number | null>(null);

  function getPhoto(slot: RoomPhotoSlot) {
    return [room?.room_photo_1, room?.room_photo_2, room?.room_photo_3][slot - 1];
  }

  useEffect(() => {
    if (room && initializedRoom.current !== room.id) {
      initializedRoom.current = room.id;
      setName(room.name);
      setMacAddress(room.mac_address ?? "");
    }
  }, [room]);

  useEffect(() => {
    if (!isAdmin) router.replace("/(app)");
  }, [isAdmin]);

  if (!isAdmin) return null;

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Carregando sala...</Text>
      </View>
    );
  }

  if (isError || !room) {
    return (
      <Screen contentContainerStyle={{ gap: 12, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Não foi possível carregar a sala.</Text>
        <PrimaryButton label="Tentar novamente" onPress={() => refetch()} />
      </Screen>
    );
  }

  async function handlePickPhoto(slot: RoomPhotoSlot) {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) {
      uploadPhoto.mutate(
        { slot, asset: result.assets[0] },
        {
          onError: () => setError("Não foi possível enviar a foto."),
        },
      );
    }
  }

  async function handleSave() {
    setAttemptedSubmit(true);
    if (!name.trim() || name.trim().length > 100) {
      setError("Informe um nome de sala com até 100 caracteres.");
      return;
    }
    const normalizedMac = macAddress.trim();
    if (!normalizedMac) {
      setError("Informe o MAC address do ESP32.");
      return;
    }
    if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(normalizedMac)) {
      setError("Informe um MAC address no formato AA:BB:CC:DD:EE:FF.");
      return;
    }
    setError(null);
    try {
      await updateRoom.mutateAsync({
        name: name.trim(),
        mac_address: normalizedMac.toUpperCase(),
      });
      setName("");
      setMacAddress("");
      setError(null);
      setAttemptedSubmit(false);
      router.back();
    } catch {
      setError("Não foi possível salvar. Confira o MAC e se ele já não está vinculado a outra sala.");
    }
  }

  async function handleDeletePhoto(slot: RoomPhotoSlot) {
    setError(null);
    if (!(await confirmAction("Excluir foto", "Deseja remover esta foto da sala?"))) return;
    deletePhoto.mutate(slot, { onError: () => setError("Não foi possível excluir a foto.") });
  }

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", gap: spacing.lg }}>
      <SurfaceCard>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, textAlign: "center" }}>
          Editar sala
        </Text>

        <FormField
          label="Nome da sala"
          placeholder="Nome da sala"
          value={name}
          onChangeText={setName}
          maxLength={100}
          helperText="Obrigatório. Use até 100 caracteres."
          error={attemptedSubmit && !name.trim() ? "Este campo é obrigatório." : undefined}
          onSubmitEditing={handleSave}
        />
        <FormField
          label="MAC address do ESP32 *"
          placeholder="AA:BB:CC:DD:EE:FF"
          value={macAddress}
          onChangeText={setMacAddress}
          autoCapitalize="characters"
          maxLength={17}
          helperText="Obrigatório. MAC único do controlador, no formato AA:BB:CC:DD:EE:FF."
          error={
            attemptedSubmit &&
            (!macAddress.trim() || !/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(macAddress.trim()))
              ? macAddress.trim()
                ? "Confira os 6 pares hexadecimais separados por dois-pontos."
                : "Este campo é obrigatório."
              : undefined
          }
        />

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {[1, 2, 3].map((slot) => {
            const slotNumber = slot as RoomPhotoSlot;
            const photo = getPhoto(slotNumber);
            const isBusy = uploadPhoto.isPending || deletePhoto.isPending;

            return (
              <View
                key={slot}
                style={{
                  flexGrow: 1,
                  flexBasis: 96,
                  minWidth: 82,
                  maxWidth: "31%",
                  gap: spacing.xs,
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${photo ? "Substituir" : "Adicionar"} foto ${slot}`}
                  onPress={() => handlePickPhoto(slotNumber)}
                  disabled={isBusy}
                  style={({ pressed }) => ({
                    aspectRatio: 1,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: pressed ? colors.borderStrong : colors.border,
                    borderRadius: radii.field,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: photo ? colors.surfaceMuted : colors.surfaceAccent,
                    opacity: isBusy ? 0.6 : pressed ? 0.8 : 1,
                  })}
                >
                  {photo ? (
                    <AuthenticatedImage
                      uri={photo}
                      label={`Preview da foto ${slot}`}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <Text
                      style={{ ...typography.caption, color: colors.primary, textAlign: "center" }}
                    >
                      Adicionar foto {slot}
                    </Text>
                  )}
                  {photo && (
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        right: spacing.xs,
                        bottom: spacing.xs,
                        paddingHorizontal: spacing.xs,
                        paddingVertical: 3,
                        borderRadius: radii.pill,
                        backgroundColor: "rgba(17, 24, 39, 0.72)",
                      }}
                    >
                      <Text style={{ ...typography.caption, color: colors.white }}>Substituir</Text>
                    </View>
                  )}
                </Pressable>

                {photo && (
                  <IconButton
                    icon="trash-outline"
                    label={`Excluir foto ${slot}`}
                    destructive
                    onPress={() => handleDeletePhoto(slotNumber)}
                    disabled={isBusy}
                    style={{ alignSelf: "center" }}
                  />
                )}
              </View>
            );
          })}
        </View>
        {error && <FeedbackMessage message={error} />}

        <PrimaryButton
          label="Salvar"
          onPress={handleSave}
          loading={updateRoom.isPending || uploadPhoto.isPending || deletePhoto.isPending}
        />
      </SurfaceCard>

      <DeviceCredentialSection
        roomId={roomId}
        macAddress={room.mac_address}
        hasCredential={room.has_device_credential ?? false}
      />
    </Screen>
  );
}
