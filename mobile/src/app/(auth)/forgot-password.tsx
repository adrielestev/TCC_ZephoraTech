import { useState } from "react";
import { Text } from "react-native";
import { Link } from "expo-router";
import { authApi } from "@/api/auth";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { BrandHeader } from "@/components/BrandHeader";
import { SurfaceCard } from "@/components/SurfaceCard";
import { colors, spacing } from "@/theme/tokens";

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setAttemptedSubmit(true);
    setError(null);
    if (!validEmail(email)) return;
    setLoading(true);
    try {
      await authApi.requestPasswordReset({ email: email.trim() });
      setSent(true);
    } catch {
      setError("Não foi possível concluir a solicitação agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", gap: spacing.lg }}>
      <BrandHeader />
      <SurfaceCard>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, textAlign: "center" }}>
          Recuperar senha
        </Text>
        {sent ? (
          <>
            <Text style={{ color: colors.muted, lineHeight: 21, textAlign: "center" }}>
              Se houver uma conta verificada com este e-mail, enviaremos um código de recuperação.
              Confira sua caixa de entrada e o spam.
            </Text>
            <Link href={{ pathname: "/(auth)/reset-password", params: { email: email.trim() } }}>
              <Text style={{ color: colors.primary, fontWeight: "800", textAlign: "center" }}>
                Já tenho o código
              </Text>
            </Link>
          </>
        ) : (
          <>
            <Text style={{ color: colors.muted, lineHeight: 21 }}>
              Informe o e-mail da sua conta. Enviaremos um código temporário para redefinir a senha.
            </Text>
            <FormField
              label="E-mail"
              placeholder="voce@exemplo.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              helperText="Por segurança, a mensagem de confirmação não revela se a conta existe."
              error={attemptedSubmit && !validEmail(email) ? "Digite um e-mail válido." : undefined}
            />
            {error && (
              <Text accessibilityRole="alert" style={{ color: colors.error }}>
                {error}
              </Text>
            )}
            <PrimaryButton label="Enviar código" onPress={handleSubmit} loading={loading} />
          </>
        )}
        <Link href="/(auth)/login">
          <Text style={{ color: colors.muted, textAlign: "center" }}>Voltar para entrar</Text>
        </Link>
      </SurfaceCard>
    </Screen>
  );
}
