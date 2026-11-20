import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { getErrorMessage } from '@/core/api/errors';
import { pickImage } from '@/core/api/upload';
import { useAuth, useCurrentUser } from '@/core/auth/AuthProvider';
import { usersApi } from '@/features/users/api';
import { RoleBadge } from '@/features/users/components';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card, CardFooter, CardHeader } from '@/ui/Card';
import { useConfirm, useToast } from '@/ui/Feedback';
import { Screen } from '@/ui/Screen';
import { PageHeader } from '@/ui/PageHeader';
import { TextField } from '@/ui/TextField';
import { spacing } from '@/ui/theme';

export default function ProfileScreen() {
  const user = useCurrentUser();
  const { setUser, signOut } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [name, setName] = useState(user.name);
  const [nameError, setNameError] = useState<string | undefined>();

  const saveName = useMutation({
    mutationFn: (value: string) => usersApi.updateMe(value),
    onSuccess: (updated) => {
      setUser(updated);
      toast('Nome atualizado.', 'success');
    },
    onError: (error) => toast(getErrorMessage(error), 'danger'),
  });

  const changeAvatar = useMutation({
    mutationFn: async () => {
      const asset = await pickImage([1, 1]);
      return asset ? usersApi.setMyAvatar(asset) : null;
    },
    onSuccess: (updated) => {
      if (updated) {
        setUser(updated);
        toast('Foto atualizada.', 'success');
      }
    },
    onError: (error) => toast(getErrorMessage(error), 'danger'),
  });

  const removeAvatar = useMutation({
    mutationFn: usersApi.removeMyAvatar,
    onSuccess: (updated) => {
      setUser(updated);
      toast('Foto removida.', 'success');
    },
    onError: (error) => toast(getErrorMessage(error), 'danger'),
  });

  const submitName = () => {
    const value = name.trim();
    if (value.length < 2) return setNameError('O nome deve ter ao menos 2 letras.');
    setNameError(undefined);
    if (value !== user.name) saveName.mutate(value);
  };

  const logout = async () => {
    const ok = await confirm({
      title: 'Sair da conta?',
      message: 'Você precisará entrar novamente com seu e-mail e senha.',
      confirmLabel: 'Sair',
    });
    if (ok) await signOut();
  };

  return (
    <Screen width="form">
      <PageHeader eyebrow="Sua conta" title="Perfil" />

      <Card>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Avatar name={user.name} uri={user.avatarUrl} size={88} />
          <AppText variant="title" center>
            {user.name}
          </AppText>
          <AppText color="textMuted" center>
            {user.email}
          </AppText>
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <RoleBadge role={user.role} />
            {user.emailVerified ? (
              <Badge label="E-mail verificado" tone="success" icon="checkmark-circle" />
            ) : null}
          </View>
        </View>
        <CardFooter>
          <Button
            label={user.avatarUrl ? 'Trocar foto' : 'Adicionar foto'}
            icon="camera-outline"
            variant="outline"
            size="sm"
            fullWidth={false}
            loading={changeAvatar.isPending}
            onPress={() => changeAvatar.mutate()}
            style={{ flex: 1 }}
          />
          {user.avatarUrl ? (
            <Button
              label="Remover foto"
              variant="ghost"
              size="sm"
              fullWidth={false}
              loading={removeAvatar.isPending}
              onPress={() => removeAvatar.mutate()}
            />
          ) : null}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader
          title="Seus dados"
          description="Como seu nome aparece para os administradores."
        />
        <TextField
          label="Nome"
          value={name}
          onChangeText={setName}
          error={nameError}
          autoComplete="name"
          returnKeyType="done"
          onSubmitEditing={submitName}
        />
        <Button
          label="Salvar nome"
          onPress={submitName}
          loading={saveName.isPending}
          disabled={name.trim() === user.name}
        />
      </Card>

      <Button label="Sair da conta" variant="outline" icon="log-out-outline" onPress={logout} />
    </Screen>
  );
}
