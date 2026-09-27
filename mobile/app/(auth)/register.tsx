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

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (name.trim().length < 2 || !email.trim() || password.length < 8) {
      setError("Informe nome, e-mail e uma senha com pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ name: name.trim(), email: email.trim(), password });
      router.push({ pathname: "/(auth)/verify-email", params: { email } });
    } catch {
      setError("Não foi possível criar a conta. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", gap: spacing.lg }}>
      <BrandHeader />
      <SurfaceCard>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, textAlign: "center" }}>
          Criar conta
        </Text>
        <FormField
          label="Nome"
          placeholder="Seu nome"
          value={name}
          onChangeText={setName}
          autoComplete="name"
        />
        <FormField
          label="E-mail"
          placeholder="voce@exemplo.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <FormField
          label="Senha"
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
        <PrimaryButton label="Cadastrar" onPress={handleSubmit} loading={loading} />
      </SurfaceCard>
    </Screen>
  );
}
