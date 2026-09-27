import { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { authApi } from "../../src/api/auth";
import { FormField } from "../../src/components/FormField";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { Screen } from "../../src/components/Screen";
import { BrandHeader } from "../../src/components/BrandHeader";
import { SurfaceCard } from "../../src/components/SurfaceCard";
import { colors, spacing } from "../../src/theme/tokens";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !email.includes("@")) {
      setMessage("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setMessage("Se o e-mail existir, um código de redefinição foi enviado.");
      router.push({ pathname: "/(auth)/reset-password", params: { email: email.trim() } });
    } catch {
      setMessage("Não foi possível enviar o código agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", gap: spacing.lg }}>
      <BrandHeader />
      <SurfaceCard>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, textAlign: "center" }}>
          Esqueci minha senha
        </Text>
        <FormField
          label="E-mail"
          placeholder="voce@exemplo.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          onSubmitEditing={handleSubmit}
        />
        {message && (
          <Text accessibilityRole="alert" style={{ color: colors.text, lineHeight: 20 }}>
            {message}
          </Text>
        )}
        <PrimaryButton label="Enviar código" onPress={handleSubmit} loading={loading} />
      </SurfaceCard>
    </Screen>
  );
}
