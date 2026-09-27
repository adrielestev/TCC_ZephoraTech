import { useState } from "react";
import { Text, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { authApi } from "../../src/api/auth";
import { FormField } from "../../src/components/FormField";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { Screen } from "../../src/components/Screen";
import { BrandHeader } from "../../src/components/BrandHeader";
import { SurfaceCard } from "../../src/components/SurfaceCard";
import { colors, spacing } from "../../src/theme/tokens";

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    if (!/^\d{6}$/.test(code)) {
      setMessage("Informe o código de 6 dígitos.");
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyEmail({ email, code });
      router.replace("/(auth)/login");
    } catch {
      setMessage("Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    try {
      await authApi.resendCode({ email });
      setMessage("Novo código enviado.");
    } catch {
      setMessage("Não foi possível reenviar o código agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", gap: spacing.lg }}>
      <BrandHeader />
      <SurfaceCard>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, textAlign: "center" }}>
          Verificar e-mail
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }}>Enviamos um código para {email}</Text>
        <FormField
          label="Código"
          placeholder="000000"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
        />
        {message && (
          <Text accessibilityRole="alert" style={{ color: colors.text, lineHeight: 20 }}>
            {message}
          </Text>
        )}
        <PrimaryButton label="Confirmar" onPress={handleVerify} loading={loading} />
        <Pressable onPress={handleResend} disabled={loading} hitSlop={8} accessibilityRole="button">
          <Text
            style={{
              color: colors.primary,
              fontWeight: "700",
              textDecorationLine: "underline",
              textAlign: "center",
            }}
          >
            Reenviar código
          </Text>
        </Pressable>
      </SurfaceCard>
    </Screen>
  );
}
