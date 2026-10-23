import { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { authApi } from "@/api/auth";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { BrandHeader } from "@/components/BrandHeader";
import { SurfaceCard } from "@/components/SurfaceCard";
import { colors, spacing } from "@/theme/tokens";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  async function handleSubmit() {
    setAttemptedSubmit(true);
    if (
      name.trim().length < 2 ||
      name.trim().length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      password.length < 8
    ) {
      setError("Revise os campos destacados antes de continuar.");
      return;
    }
    setLoading(true);
    try {
      const registeredEmail = email.trim();
      await authApi.register({ name: name.trim(), email: registeredEmail, password });
      setName("");
      setEmail("");
      setPassword("");
      setAttemptedSubmit(false);
      router.push({ pathname: "/(auth)/verify-email", params: { email: registeredEmail } });
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
          maxLength={100}
          helperText="Informe seu nome (2 a 100 caracteres)."
          error={
            attemptedSubmit && name.trim().length < 2 ? "Informe ao menos 2 caracteres." : undefined
          }
        />
        <FormField
          label="E-mail"
          placeholder="voce@exemplo.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          helperText="Usaremos este endereço para entrar e confirmar sua conta."
          error={
            attemptedSubmit && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
              ? "Digite um e-mail válido."
              : undefined
          }
        />
        <FormField
          label="Senha"
          placeholder="Mínimo de 8 caracteres"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          onSubmitEditing={handleSubmit}
          helperText="Use pelo menos 8 caracteres."
          error={
            attemptedSubmit && password.length < 8
              ? "A senha deve ter pelo menos 8 caracteres."
              : undefined
          }
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
