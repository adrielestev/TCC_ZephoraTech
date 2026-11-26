// src/features/auth/screens/LoginScreen.tsx -- Apresenta o formulário de login e conduz o usuário após autenticar.
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { routes } from '@/core/navigation/routes';
import { getErrorCode, getErrorMessage } from '@/core/api/errors';
import { useAuth } from '@/core/auth/AuthProvider';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { FormField } from '@/ui/FormField';
import type { TextInputHandle } from '@/ui/TextField';
import { AuthLayout } from '../components/AuthLayout';
import { authApi } from '../api';
import { loginSchema, type LoginForm } from '../schemas';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, sessionExpired, dismissSessionExpired } = useAuth();
  const params = useLocalSearchParams<{ email?: string; verified?: string; reset?: string }>();
  const [formError, setFormError] = useState<string | null>(null);
  const passwordRef = useRef<TextInputHandle>(null);

  const { control, handleSubmit, getValues } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: params.email ?? '', password: '' },
  });

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ token, user }) => signIn(token, user),
    onError: (error) => {
      if (getErrorCode(error) === 'EMAIL_NOT_VERIFIED') {
        // O servidor já enviou um novo código; segue para a verificação
        router.push(routes.verifyEmail(getValues('email').trim()));
        return;
      }
      setFormError(getErrorMessage(error));
    },
  });

  const submit = handleSubmit((values) => {
    setFormError(null);
    dismissSessionExpired();
    login.mutate({ email: values.email.trim(), password: values.password });
  });

  return (
    <AuthLayout title="Entrar" subtitle="Use seu e-mail e senha para continuar.">
      {sessionExpired ? (
        <Banner tone="warning" message="Sua sessão expirou. Entre novamente." />
      ) : null}
      {params.verified ? (
        <Banner tone="success" message="E-mail verificado! Agora é só entrar." />
      ) : null}
      {params.reset ? (
        <Banner tone="success" message="Senha alterada. Entre com a nova senha." />
      ) : null}
      {formError ? <Banner tone="danger" message={formError} /> : null}

      <FormField
        control={control}
        name="email"
        label="E-mail"
        placeholder="voce@escola.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <FormField
        control={control}
        name="password"
        label="Senha"
        inputRef={passwordRef}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />

      <Button label="Entrar" onPress={submit} loading={login.isPending} />
      <Button
        label="Esqueci a senha"
        variant="ghost"
        size="sm"
        onPress={() => router.push(routes.forgotPassword(getValues('email').trim()))}
      />
      <Button label="Criar conta" variant="outline" onPress={() => router.push(routes.register)} />
    </AuthLayout>
  );
}
