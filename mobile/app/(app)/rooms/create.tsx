import { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useCreateRoom } from "../../../src/hooks/useRooms";
import { FormField } from "../../../src/components/FormField";
import { PrimaryButton } from "../../../src/components/PrimaryButton";
import { Screen } from "../../../src/components/Screen";
import { SurfaceCard } from "../../../src/components/SurfaceCard";
import { colors, spacing } from "../../../src/theme/tokens";

export default function CreateRoomScreen() {
  const createRoom = useCreateRoom();
  const [name, setName] = useState("");
  const [classroomCode, setClassroomCode] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim() || !classroomCode.trim() || !macAddress.trim()) {
      setError("Preencha todos os campos.");
      return;
    }

    setError(null);
    try {
      const { data } = await createRoom.mutateAsync({
        name: name.trim(),
        classroom_code: classroomCode.trim(),
        mac_address: macAddress.trim(),
      });
      router.replace(`/(app)/rooms/${data.room.id}` as never);
    } catch {
      setError("Não foi possível criar a sala. Confira os dados.");
    }
  }

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", gap: spacing.lg }}>
      <SurfaceCard>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, textAlign: "center" }}>
          Nova sala
        </Text>
        <FormField label="Nome" placeholder="Nome da sala" value={name} onChangeText={setName} />
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
          onSubmitEditing={handleSave}
        />
        {error && (
          <Text accessibilityRole="alert" style={{ color: colors.error, fontWeight: "600" }}>
            {error}
          </Text>
        )}
        <PrimaryButton label="Criar sala" onPress={handleSave} loading={createRoom.isPending} />
      </SurfaceCard>
    </Screen>
  );
}
