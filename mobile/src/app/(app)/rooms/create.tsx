import { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useCreateRoom } from "@/hooks/useRooms";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SurfaceCard } from "@/components/SurfaceCard";
import { colors, spacing } from "@/theme/tokens";

export default function CreateRoomScreen() {
  const createRoom = useCreateRoom();
  const [name, setName] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  async function handleSave() {
    setAttemptedSubmit(true);
    const normalizedMac = macAddress.trim();
    if (!name.trim() || name.trim().length > 100) {
      setError("Informe um nome de sala com até 100 caracteres.");
      return;
    }
    if (!normalizedMac) {
      setError("Informe o MAC address do ESP32.");
      return;
    }
    if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(normalizedMac)) {
      setError("O MAC deve seguir o formato AA:BB:CC:DD:EE:FF.");
      return;
    }

    setError(null);
    try {
      const { data } = await createRoom.mutateAsync({
        name: name.trim(),
        mac_address: normalizedMac.toUpperCase(),
      });
      setName("");
      setMacAddress("");
      setError(null);
      setAttemptedSubmit(false);
      router.replace(`/(app)/rooms/${data.room.id}` as never);
    } catch {
      setError("Não foi possível criar a sala. Confira o MAC e se ele já não está vinculado a outra sala.");
    }
  }

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", gap: spacing.lg }}>
      <SurfaceCard>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, textAlign: "center" }}>
          Nova sala
        </Text>
        <FormField
          label="Nome da sala *"
          placeholder="Ex.: Sala de estar"
          value={name}
          onChangeText={setName}
          maxLength={100}
          helperText="Obrigatório. Escolha um nome fácil de identificar."
          error={attemptedSubmit && !name.trim() ? "Este campo é obrigatório." : undefined}
        />
        <FormField
          label="MAC address do ESP32 *"
          placeholder="AA:BB:CC:DD:EE:FF"
          value={macAddress}
          onChangeText={setMacAddress}
          autoCapitalize="characters"
          maxLength={17}
          onSubmitEditing={handleSave}
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
