import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { routes } from '@/core/navigation/routes';
import { getErrorMessage } from '@/core/api/errors';
import { useCountdown } from '@/core/hooks/useCountdown';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { FormField } from '@/ui/FormField';
import { useToast } from '@/ui/Feedback';
import { AuthLayout } from '../components/AuthLayout';
import { CodeField } from '../components/CodeField';
import { authApi } from '../api';
import { verifyEmailSchema, type VerifyEmailForm } from '../schemas';

const RESEND_SECONDS = 60;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ email?: string }>();
  const hasEmail = !!params.email;
  const [formError, setFormError] = useState<string | null>(null);
  const cooldown = useCountdown(RESEND_SECONDS); // o código acabou de ser enviado

  const { control, handleSubmit, getValues, trigger } = useForm<VerifyEmailForm>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email: params.email ?? '', code: '' },
  });

  useEffect(() => {
    if (params.email) cooldown.start(RESEND_SECONDS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.email]);

  const verify = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: (_data, variables) =>
      router.replace(routes.loginWith({ email: variables.email, verified: '1' })),
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const resend = useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: () => {
      cooldown.start(RESEND_SECONDS);
      toast('Se o e-mail estiver pendente, enviamos um novo código.', 'success');
    },
    onError: (error) => toast(getErrorMessage(error), 'danger'),
  });

  const submit = handleSubmit((values) => {
    setFormError(null);
    verify.mutate({ email: values.email.trim(), code: values.code });
  });

  const resendCode = async () => {
    if (!(await trigger('email'))) return;
    resend.mutate({ email: getValues('email').trim() });
  };

  return (
    <AuthLayout
      title="Verifique seu e-mail"
      subtitle={
        hasEmail
          ? `Enviamos um código de 6 dígitos para ${params.email}. Ele vale por alguns minutos.`
          : 'Informe seu e-mail e o código de 6 dígitos que enviamos.'
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

      <Button label="Verificar e-mail" onPress={submit} loading={verify.isPending} />
      <Button
        label={cooldown.isRunning ? `Reenviar código em ${cooldown.seconds}s` : 'Reenviar código'}
        variant="secondary"
        onPress={resendCode}
        disabled={cooldown.isRunning}
        loading={resend.isPending}
      />
      <Button label="Voltar ao login" variant="ghost" onPress={() => router.replace(routes.login)} />
    </AuthLayout>
  );
}
