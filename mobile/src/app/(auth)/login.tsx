import { useState } from "react";
import { Text, View } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { BrandHeader } from "@/components/BrandHeader";
import { SurfaceCard } from "@/components/SurfaceCard";
import { colors, spacing } from "@/theme/tokens";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  async function handleSubmit() {
    setAttemptedSubmit(true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) {
      setError("Informe um e-mail válido e sua senha.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      setEmail("");
      setPassword("");
      setAttemptedSubmit(false);
    } catch {
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", gap: spacing.lg }}>
      <BrandHeader />
      <SurfaceCard>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, textAlign: "center" }}>
          Entrar
        </Text>

        <FormField
          label="E-mail"
          placeholder="voce@exemplo.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          helperText="Digite o e-mail cadastrado na sua conta."
          error={
            attemptedSubmit && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
              ? "Digite um e-mail válido."
              : undefined
          }
        />
        <FormField
          label="Senha"
          placeholder="Sua senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          onSubmitEditing={handleSubmit}
          helperText="Digite a senha da sua conta."
          error={attemptedSubmit && !password ? "A senha é obrigatória." : undefined}
        />

        {error && (
          <Text accessibilityRole="alert" style={{ color: colors.error, fontWeight: "600" }}>
            {error}
          </Text>
        )}

        <PrimaryButton label="Entrar" onPress={handleSubmit} loading={loading} />
      </SurfaceCard>
      <View style={{ alignItems: "center", gap: spacing.xs }}>
        <Link href="/(auth)/forgot-password">
          <Text
            style={{ color: colors.primary, fontWeight: "700", textDecorationLine: "underline" }}
          >
            Esqueci minha senha
          </Text>
        </Link>
        <Text style={{ color: colors.muted }}>Ainda não possui uma conta?</Text>
        <Link href="/(auth)/register">
          <Text style={{ color: colors.text, fontWeight: "800", textDecorationLine: "underline" }}>
            Criar conta
          </Text>
        </Link>
      </View>
    </Screen>
  );
}
