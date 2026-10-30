import { useState } from "react";
import { Text, Pressable } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { usersApi } from "@/api/users";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SurfaceCard } from "@/components/SurfaceCard";
import { colors, spacing } from "@/theme/tokens";
import { IconButton } from "@/components/IconButton";
import { FeedbackMessage } from "@/components/FeedbackMessage";
import { confirmAction } from "@/utils/confirm-action";

export default function ProfileEditScreen() {
  const { user, refreshMe } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) {
      setLoading(true);
      try {
        await usersApi.uploadMyPhoto(result.assets[0]);
        await refreshMe();
      } catch {
        setError("Não foi possível atualizar a foto.");
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleDeletePhoto() {
    if (!(await confirmAction("Excluir foto", "Deseja remover sua foto de perfil?"))) return;
    setLoading(true);
    try {
      await usersApi.deleteMyPhoto();
      await refreshMe();
    } catch {
      setError("Não foi possível excluir a foto.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setAttemptedSubmit(true);
    if (name.trim().length < 2 || name.trim().length > 100) {
      setError("O nome deve ter entre 2 e 100 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await usersApi.updateMe({ name: name.trim() });
      await refreshMe();
      setName("");
      setError(null);
      setAttemptedSubmit(false);
      router.back();
    } catch {
      setError("Não foi possível salvar o perfil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", gap: spacing.lg }}>
      <SurfaceCard>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, textAlign: "center" }}>
          Editar perfil
        </Text>

        <Pressable onPress={handlePickPhoto} style={{ alignItems: "center" }}>
          <Text>Alterar foto</Text>
        </Pressable>
        {user?.user_photo && (
          <IconButton
            icon="trash-outline"
            label="Excluir foto de perfil"
            destructive
            onPress={handleDeletePhoto}
            style={{ alignSelf: "center" }}
          />
        )}

        <FormField
          label="Nome"
          placeholder="Seu nome"
          value={name}
          onChangeText={setName}
          maxLength={100}
          helperText="Seu nome será exibido em salas e automações."
          error={
            attemptedSubmit && name.trim().length < 2 ? "Informe ao menos 2 caracteres." : undefined
          }
          onSubmitEditing={handleSave}
        />
        <Text style={{ color: colors.muted }}>{user?.email}</Text>
        {error && <FeedbackMessage message={error} />}

        <PrimaryButton label="Salvar" onPress={handleSave} loading={loading} />
      </SurfaceCard>
    </Screen>
  );
}
