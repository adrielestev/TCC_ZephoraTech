import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { routes } from '@/core/navigation/routes';
import { getErrorMessage } from '@/core/api/errors';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { FormField } from '@/ui/FormField';
import type { TextInputHandle } from '@/ui/TextField';
import { AuthLayout } from '../components/AuthLayout';
import { authApi } from '../api';
import { registerSchema, type RegisterForm } from '../schemas';

export default function RegisterScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<TextInputHandle>(null);
  const passwordRef = useRef<TextInputHandle>(null);
  const confirmRef = useRef<TextInputHandle>(null);

  const { control, handleSubmit } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const register = useMutation({
    mutationFn: authApi.register,
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const email = values.email.trim();
    await register.mutateAsync({ name: values.name.trim(), email, password: values.password });
    router.replace(routes.verifyEmail(email));
  });

  return (
    <AuthLayout title="Criar conta" subtitle="Use seu e-mail. Enviaremos um código para confirmá-lo.">
      {formError ? <Banner tone="danger" message={formError} /> : null}

      <FormField
        control={control}
        name="name"
        label="Nome"
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <FormField
        control={control}
        name="email"
        label="E-mail"
        inputRef={emailRef}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <FormField
        control={control}
        name="password"
        label="Senha"
        hint="Mínimo de 8 caracteres."
        inputRef={passwordRef}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <FormField
        control={control}
        name="confirmPassword"
        label="Repita a senha"
        inputRef={confirmRef}
        secureTextEntry
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />

      <Button label="Criar conta" onPress={submit} loading={register.isPending} />
      <Button label="Já tenho conta" variant="ghost" onPress={() => router.replace(routes.login)} />
    </AuthLayout>
  );
}
