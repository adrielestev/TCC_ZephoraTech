import { useState } from "react";
import { Text, View } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { FormField } from "../../src/components/FormField";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { Screen } from "../../src/components/Screen";
import { BrandHeader } from "../../src/components/BrandHeader";
import { SurfaceCard } from "../../src/components/SurfaceCard";
import { colors, spacing } from "../../src/theme/tokens";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError("Informe e-mail e senha.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
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
        />

        {error && (
          <Text accessibilityRole="alert" style={{ color: colors.error, fontWeight: "600" }}>
            {error}
          </Text>
        )}

        <PrimaryButton label="Entrar" onPress={handleSubmit} loading={loading} />

        <Link href="/(auth)/forgot-password">
          <Text
            style={{
              color: colors.primary,
              fontWeight: "700",
              textDecorationLine: "underline",
              textAlign: "center",
            }}
          >
            Esqueci minha senha
          </Text>
        </Link>
      </SurfaceCard>
      <View style={{ alignItems: "center", gap: spacing.xs }}>
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
