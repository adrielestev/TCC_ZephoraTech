import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { routes } from '@/core/navigation/routes';
import { getErrorMessage } from '@/core/api/errors';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { FormField } from '@/ui/FormField';
import { AuthLayout } from '../components/AuthLayout';
import { authApi } from '../api';
import { emailSchema, type EmailForm } from '../schemas';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: params.email ?? '' },
  });

  const forgot = useMutation({
    mutationFn: authApi.forgotPassword,
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const submit = handleSubmit(async ({ email }) => {
    setFormError(null);
    const clean = email.trim();
    await forgot.mutateAsync({ email: clean });
    router.push(routes.resetPassword(clean));
  });

  return (
    <AuthLayout
      title="Esqueci a senha"
      subtitle="Informe seu e-mail. Se ele estiver cadastrado, enviaremos um código para criar uma nova senha."
    >
      {formError ? <Banner tone="danger" message={formError} /> : null}
      <FormField
        control={control}
        name="email"
        label="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />
      <Button label="Enviar código" onPress={submit} loading={forgot.isPending} />
      <Button label="Voltar ao login" variant="ghost" onPress={() => router.back()} />
    </AuthLayout>
  );
}
