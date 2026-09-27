import { useState } from "react";
import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { authApi } from "../../src/api/auth";
import { FormField } from "../../src/components/FormField";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { Screen } from "../../src/components/Screen";
import { BrandHeader } from "../../src/components/BrandHeader";
import { SurfaceCard } from "../../src/components/SurfaceCard";
import { colors, spacing } from "../../src/theme/tokens";

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!/^\d{6}$/.test(code) || password.length < 8) {
      setError("Informe o código de 6 dígitos e uma senha com pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, code, password });
      router.replace("/(auth)/login");
    } catch {
      setError("Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", gap: spacing.lg }}>
      <BrandHeader />
      <SurfaceCard>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, textAlign: "center" }}>
          Redefinir senha
        </Text>
        <FormField
          label="Código"
          placeholder="000000"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          autoComplete="one-time-code"
        />
        <FormField
          label="Nova senha"
          placeholder="Mínimo de 8 caracteres"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          onSubmitEditing={handleSubmit}
        />
        {error && (
          <Text accessibilityRole="alert" style={{ color: colors.error, fontWeight: "600" }}>
            {error}
          </Text>
        )}
        <PrimaryButton label="Salvar nova senha" onPress={handleSubmit} loading={loading} />
      </SurfaceCard>
    </Screen>
  );
}
