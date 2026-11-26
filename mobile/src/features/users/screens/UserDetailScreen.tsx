// src/features/users/screens/UserDetailScreen.tsx -- Mostra os dados de um usuário e permite administrar suas permissões.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getErrorMessage } from '@/core/api/errors';
import { useAuth } from '@/core/auth/AuthProvider';
import { useNumericParam } from '@/core/hooks/useNumericParam';
import type { User } from '@/core/types';
import { useRooms } from '@/features/rooms/hooks';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { useConfirm, useToast } from '@/ui/Feedback';
import { Screen } from '@/ui/Screen';
import { CheckRow } from '@/ui/Selectors';
import { QueryBoundary } from '@/ui/States';
import { spacing } from '@/ui/theme';
import { RoleBadge, StatusBadges } from '../components';
import { useChangeRole, useChangeStatus, useSetUserRooms, useUser, useUserRooms } from '../hooks';

export default function UserDetailScreen() {
  const userId = useNumericParam('userId');
  const user = useUser(userId);
  return <QueryBoundary query={user}>{(data) => <UserDetail user={data} />}</QueryBoundary>;
}

function UserDetail({ user }: { user: User }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { user: me, isOwner } = useAuth();
  const changeRole = useChangeRole(user.id);
  const changeStatus = useChangeStatus(user.id);

  const isSelf = me?.id === user.id;
  const isTargetOwner = user.role === 'owner';
  // Só o admin padrão promove ou rebaixa; ninguém altera o admin padrão nem a si mesmo
  const canChangeRole = isOwner && !isSelf && !isTargetOwner;
  // Admin comum não mexe em outro admin
  const canChangeStatus = !isSelf && !isTargetOwner && (isOwner || user.role === 'member');

  const toggleRole = async () => {
    const promote = user.role === 'member';
    const ok = await confirm({
      title: promote ? 'Promover a admin?' : 'Voltar a usuário comum?',
      message: promote
        ? `${user.name} poderá criar salas, cadastrar aparelhos e gerenciar usuários.`
        : `${user.name} perderá o acesso à administração e só verá as salas liberadas para ele.`,
      confirmLabel: promote ? 'Promover' : 'Rebaixar',
      destructive: !promote,
    });
    if (!ok) return;
    changeRole.mutate(promote ? 'admin' : 'member', {
      onSuccess: () =>
        toast(promote ? 'Usuário promovido a admin.' : 'Usuário voltou a ser comum.', 'success'),
      onError: (error) => toast(getErrorMessage(error), 'danger'),
    });
  };

  const toggleStatus = async () => {
    const deactivate = user.isActive;
    const ok = await confirm({
      title: deactivate ? 'Desativar conta?' : 'Reativar conta?',
      message: deactivate
        ? `${user.name} perde o acesso na hora e não consegue mais entrar.`
        : `${user.name} poderá entrar novamente.`,
      confirmLabel: deactivate ? 'Desativar' : 'Reativar',
      destructive: deactivate,
    });
    if (!ok) return;
    changeStatus.mutate(!user.isActive, {
      onSuccess: () => toast(deactivate ? 'Conta desativada.' : 'Conta reativada.', 'success'),
      onError: (error) => toast(getErrorMessage(error), 'danger'),
    });
  };

  return (
    <Screen width="form">
      <Card>
        <View style={styles.header}>
          <Avatar name={user.name} uri={user.avatarUrl} size={72} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="title">{user.name}</AppText>
            <AppText color="textMuted">{user.email}</AppText>
            <View style={styles.badges}>
              <RoleBadge role={user.role} />
              <StatusBadges user={user} />
            </View>
          </View>
        </View>
      </Card>

      {user.role === 'member' ? (
        <RoomAccessSection user={user} />
      ) : (
        <Banner tone="info" message="Admins acessam todas as salas, sem precisar de liberação." />
      )}

      <Card>
        <CardHeader title="Permissões" description="Papel do usuário no Zephora." />
        {canChangeRole ? (
          <Button
            label={user.role === 'member' ? 'Promover a admin' : 'Voltar a usuário comum'}
            icon={user.role === 'member' ? 'shield-checkmark-outline' : 'arrow-undo-outline'}
            variant="outline"
            onPress={toggleRole}
            loading={changeRole.isPending}
          />
        ) : (
          <Banner
            tone="warning"
            message={
              isTargetOwner
                ? 'O admin padrão não pode ser alterado.'
                : isSelf
                  ? 'Você não pode alterar o próprio papel.'
                  : 'Somente o admin padrão pode promover ou rebaixar usuários.'
            }
          />
        )}
      </Card>

      <Card>
        <CardHeader title="Conta" description="Desativar vale na hora: a pessoa perde o acesso." />
        {canChangeStatus ? (
          <Button
            label={user.isActive ? 'Desativar conta' : 'Reativar conta'}
            icon={user.isActive ? 'ban-outline' : 'checkmark-circle-outline'}
            variant={user.isActive ? 'danger' : 'outline'}
            onPress={toggleStatus}
            loading={changeStatus.isPending}
          />
        ) : (
          <Banner
            tone="warning"
            message={
              isTargetOwner || isSelf
                ? 'O admin padrão não pode ser alterado nem desativado.'
                : 'Somente o admin padrão pode desativar outro admin.'
            }
          />
        )}
      </Card>
    </Screen>
  );
}

function RoomAccessSection({ user }: { user: User }) {
  const toast = useToast();
  const rooms = useRooms();
  const userRooms = useUserRooms(user.id);
  const save = useSetUserRooms(user.id);
  const [selection, setSelection] = useState<number[] | null>(null);

  const current = userRooms.data ?? [];
  const selected = selection ?? current;
  const dirty =
    selection !== null &&
    (selection.length !== current.length || selection.some((id) => !current.includes(id)));

  const toggle = (id: number) =>
    setSelection(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <Card>
      <CardHeader
        title="Salas liberadas"
        description="Marque as salas que esta pessoa pode controlar."
      />
      <QueryBoundary query={rooms}>
        {(allRooms) =>
          allRooms.length === 0 ? (
            <AppText color="textMuted">Nenhuma sala criada ainda.</AppText>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {userRooms.isPending ? (
                <AppText color="textMuted">Carregando acessos...</AppText>
              ) : (
                allRooms.map((room) => (
                  <CheckRow
                    key={room.id}
                    label={room.name}
                    sublabel={room.description ?? undefined}
                    checked={selected.includes(room.id)}
                    onToggle={() => toggle(room.id)}
                  />
                ))
              )}
              <Button
                label="Salvar acessos"
                disabled={!dirty}
                loading={save.isPending}
                onPress={() =>
                  save.mutate(selected, {
                    onSuccess: () => {
                      setSelection(null);
                      toast('Acessos salvos.', 'success');
                    },
                    onError: (error) => toast(getErrorMessage(error), 'danger'),
                  })
                }
                style={{ marginTop: spacing.sm }}
              />
            </View>
          )
        }
      </QueryBoundary>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 4 },
});
