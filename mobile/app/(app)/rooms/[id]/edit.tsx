import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import {
  useDeleteRoomPhoto,
  useRoom,
  useUpdateRoom,
  useUploadRoomPhoto,
} from "../../../../src/hooks/useRooms";
import { RoomPhotoSlot } from "../../../../src/types";
import { FormField } from "../../../../src/components/FormField";
import { PrimaryButton } from "../../../../src/components/PrimaryButton";
import { Screen } from "../../../../src/components/Screen";
import { SurfaceCard } from "../../../../src/components/SurfaceCard";
import { colors, spacing } from "../../../../src/theme/tokens";
import { IconButton } from "../../../../src/components/IconButton";
import { confirmAction } from "../../../../src/utils/confirm-action";

export default function RoomEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);

  const { data: room, isLoading, isError, refetch } = useRoom(roomId);
  const updateRoom = useUpdateRoom(roomId);
  const uploadPhoto = useUploadRoomPhoto(roomId);
  const deletePhoto = useDeleteRoomPhoto(roomId);

  const [name, setName] = useState(room?.name ?? "");
  const [classroomCode, setClassroomCode] = useState(room?.classroom_code ?? "");
  const [macAddress, setMacAddress] = useState(room?.mac_address ?? "");
  const [error, setError] = useState<string | null>(null);

  function getPhoto(slot: RoomPhotoSlot) {
    return [room?.room_photo_1, room?.room_photo_2, room?.room_photo_3][slot - 1];
  }

  useEffect(() => {
    if (room) {
      setName(room.name);
      setClassroomCode(room.classroom_code);
      setMacAddress(room.mac_address);
    }
  }, [room]);

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
    if (name.trim().length < 2 || !classroomCode.trim()) {
      setError("Informe o nome e o código da turma.");
      return;
    }
    if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(macAddress.trim())) {
      setError("Informe um MAC address no formato AA:BB:CC:DD:EE:FF.");
      return;
    }
    setError(null);
    try {
      await updateRoom.mutateAsync({
        name: name.trim(),
        classroom_code: classroomCode.trim(),
        mac_address: macAddress.trim(),
      });
      router.back();
    } catch {
      setError("Não foi possível salvar a sala.");
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
          onSubmitEditing={handleSave}
        />
        <FormField
          label="Código da turma"
          placeholder="LAB-1"
          value={classroomCode}
          onChangeText={setClassroomCode}
          autoCapitalize="characters"
        />
        <FormField
          label="MAC address"
          placeholder="AA:BB:CC:DD:EE:FF"
          value={macAddress}
          onChangeText={setMacAddress}
          autoCapitalize="characters"
        />

        <View style={{ flexDirection: "row", gap: 12 }}>
          {[1, 2, 3].map((slot) => {
            const slotNumber = slot as RoomPhotoSlot;
            const photo = getPhoto(slotNumber);
            const isBusy = uploadPhoto.isPending || deletePhoto.isPending;

            return (
              <View key={slot} style={{ flex: 1, gap: 8 }}>
                <Pressable
                  onPress={() => handlePickPhoto(slotNumber)}
                  disabled={isBusy}
                  style={{
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 16,
                    alignItems: "center",
                    opacity: isBusy ? 0.6 : 1,
                  }}
                >
                  <Text>
                    {photo ? "Substituir" : "Adicionar"} foto {slot}
                  </Text>
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
        {error && (
          <Text accessibilityRole="alert" style={{ color: colors.error, fontWeight: "600" }}>
            {error}
          </Text>
        )}

        <PrimaryButton
          label="Salvar"
          onPress={handleSave}
          loading={updateRoom.isPending || uploadPhoto.isPending || deletePhoto.isPending}
        />
      </SurfaceCard>
    </Screen>
  );
}
