import { useState } from "react";
import { Text } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { authApi } from "@/api/auth";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { BrandHeader } from "@/components/BrandHeader";
import { SurfaceCard } from "@/components/SurfaceCard";
import { colors, spacing } from "@/theme/tokens";

export default function ResetPasswordScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = typeof emailParam === "string" ? emailParam : "";
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setAttemptedSubmit(true);
    setError(null);
    if (!/^\d{6}$/.test(code) || password.length < 8 || password !== confirmation || !email) return;
    setLoading(true);
    try {
      await authApi.resetPassword({ email, code, password });
      setCode("");
      setPassword("");
      setConfirmation("");
      setAttemptedSubmit(false);
      setDone(true);
    } catch {
      setError("Código inválido ou expirado. Solicite outro código e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", gap: spacing.lg }}>
      <BrandHeader />
      <SurfaceCard>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, textAlign: "center" }}>
          Nova senha
        </Text>
        {done ? (
          <>
            <Text style={{ color: colors.success, textAlign: "center", lineHeight: 21 }}>
              Sua senha foi redefinida. Agora você já pode entrar com a nova senha.
            </Text>
            <Link href="/(auth)/login">
              <Text style={{ color: colors.primary, fontWeight: "800", textAlign: "center" }}>
                Ir para entrar
              </Text>
            </Link>
          </>
        ) : (
          <>
            <Text style={{ color: colors.muted, lineHeight: 21 }}>
              Informe o código enviado para {email || "seu e-mail"} e crie uma senha com pelo menos
              8 caracteres. Use o código logo após recebê-lo; ele expira em pouco tempo.
            </Text>
            <FormField
              label="Código de recuperação"
              placeholder="000000"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              helperText="Código numérico de 6 dígitos."
              error={attemptedSubmit && !/^\d{6}$/.test(code) ? "Informe os 6 dígitos." : undefined}
            />
            <FormField
              label="Nova senha"
              placeholder="Mínimo de 8 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              helperText="Use pelo menos 8 caracteres."
              error={
                attemptedSubmit && password.length < 8
                  ? "A senha deve ter pelo menos 8 caracteres."
                  : undefined
              }
            />
            <FormField
              label="Confirmar nova senha"
              placeholder="Digite a senha novamente"
              value={confirmation}
              onChangeText={setConfirmation}
              secureTextEntry
              autoComplete="new-password"
              error={
                attemptedSubmit && password !== confirmation
                  ? "As senhas não coincidem."
                  : undefined
              }
            />
            {error && (
              <Text accessibilityRole="alert" style={{ color: colors.error }}>
                {error}
              </Text>
            )}
            <PrimaryButton label="Redefinir senha" onPress={handleSubmit} loading={loading} />
          </>
        )}
        <Link href="/(auth)/forgot-password">
          <Text style={{ color: colors.muted, textAlign: "center" }}>Solicitar outro código</Text>
        </Link>
      </SurfaceCard>
    </Screen>
  );
}
