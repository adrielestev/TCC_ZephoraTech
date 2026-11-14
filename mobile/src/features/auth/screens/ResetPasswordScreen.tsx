import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { routes } from '@/core/navigation/routes';
import { getErrorMessage } from '@/core/api/errors';
import { useCountdown } from '@/core/hooks/useCountdown';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { useToast } from '@/ui/Feedback';
import { FormField } from '@/ui/FormField';
import type { TextInputHandle } from '@/ui/TextField';
import { AuthLayout } from '../components/AuthLayout';
import { CodeField } from '../components/CodeField';
import { authApi } from '../api';
import { resetPasswordSchema, type ResetPasswordForm } from '../schemas';

const RESEND_SECONDS = 60;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ email?: string }>();
  const hasEmail = !!params.email;
  const [formError, setFormError] = useState<string | null>(null);
  const cooldown = useCountdown(RESEND_SECONDS);
  const confirmRef = useRef<TextInputHandle>(null);

  const { control, handleSubmit, getValues } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: params.email ?? '', code: '', newPassword: '', confirmPassword: '' },
  });

  const reset = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (_data, variables) =>
      router.replace(routes.loginWith({ email: variables.email, reset: '1' })),
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const resend = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      cooldown.start(RESEND_SECONDS);
      toast('Se o e-mail estiver cadastrado, enviamos um novo código.', 'success');
    },
    onError: (error) => toast(getErrorMessage(error), 'danger'),
  });

  const submit = handleSubmit((values) => {
    setFormError(null);
    reset.mutate({ email: values.email.trim(), code: values.code, newPassword: values.newPassword });
  });

  return (
    <AuthLayout
      title="Nova senha"
      subtitle={
        hasEmail
          ? `Digite o código enviado para ${params.email} e escolha uma nova senha.`
          : 'Informe seu e-mail, o código recebido e a nova senha.'
      }
    >
      {formError ? <Banner tone="danger" message={formError} /> : null}

      {!hasEmail ? (
        <FormField
          control={control}
          name="email"
          label="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      ) : null}
      <CodeField control={control} name="code" />
      <FormField
        control={control}
        name="newPassword"
        label="Nova senha"
        hint="Mínimo de 8 caracteres."
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <FormField
        control={control}
        name="confirmPassword"
        label="Repita a nova senha"
        inputRef={confirmRef}
        secureTextEntry
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />

      <Button label="Alterar senha" onPress={submit} loading={reset.isPending} />
      <Button
        label={cooldown.isRunning ? `Reenviar código em ${cooldown.seconds}s` : 'Reenviar código'}
        variant="secondary"
        disabled={cooldown.isRunning}
        loading={resend.isPending}
        onPress={() => resend.mutate({ email: getValues('email').trim() })}
      />
    </AuthLayout>
  );
}
