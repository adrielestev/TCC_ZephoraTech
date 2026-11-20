import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useDebounce } from '@/core/hooks/useDebounce';
import { routes } from '@/core/navigation/routes';
import type { User } from '@/core/types';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { CONTENT_WIDTHS, colors, spacing } from '@/ui/theme';
import { ListItem } from '@/ui/ListItem';
import { ListItemSkeleton, SkeletonList } from '@/ui/Skeleton';
import { EmptyState, ErrorView } from '@/ui/States';
import { TextField } from '@/ui/TextField';
import { RoleBadge, StatusBadges } from '../components';
import { useUsers } from '../hooks';

export default function UsersListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search.trim());
  const users = useUsers(debounced);

  const items: User[] = users.data?.pages.flatMap((p) => p.data) ?? [];
  const total = users.data?.pages[0]?.total ?? 0;

  const header = (
    <View style={styles.header}>
      <TextField
        label="Buscar por nome ou e-mail"
        icon="search-outline"
        value={search}
        onChangeText={setSearch}
        placeholder="Digite para buscar"
        autoCapitalize="none"
        returnKeyType="search"
      />
      {users.data && items.length > 0 ? (
        <AppText variant="caption" color="textMuted">
          {total === 1 ? '1 usuário' : `${total} usuários`}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(user) => String(user.id)}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      refreshing={users.isRefetching && !users.isPending}
      onRefresh={() => void users.refetch()}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (users.hasNextPage && !users.isFetchingNextPage) void users.fetchNextPage();
      }}
      ListHeaderComponent={header}
      ItemSeparatorComponent={Gap}
      renderItem={({ item: user }) => (
        <ListItem
          leading={<Avatar name={user.name} uri={user.avatarUrl} />}
          title={user.name}
          description={user.email}
          accessibilityLabel={`Abrir ${user.name}`}
          footer={
            <>
              <RoleBadge role={user.role} />
              <StatusBadges user={user} />
            </>
          }
          onPress={() => router.push(routes.user(user.id))}
        />
      )}
      ListEmptyComponent={
        users.isPending ? (
          <SkeletonList count={4}>{() => <ListItemSkeleton />}</SkeletonList>
        ) : users.isError ? (
          <ErrorView error={users.error} onRetry={() => void users.refetch()} />
        ) : (
          <EmptyState
            icon="people-outline"
            title="Nenhum usuário encontrado"
            message={
              debounced
                ? 'Tente outro nome ou e-mail.'
                : 'Quando as pessoas criarem conta, elas aparecem aqui.'
            }
          />
        )
      }
      ListFooterComponent={
        users.hasNextPage ? (
          <View style={{ marginTop: spacing.md }}>
            <Button
              label="Carregar mais"
              variant="outline"
              loading={users.isFetchingNextPage}
              onPress={() => void users.fetchNextPage()}
            />
          </View>
        ) : undefined
      }
    />
  );
}

const Gap = () => <View style={{ height: spacing.md }} />;

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  content: {
    width: '100%',
    maxWidth: CONTENT_WIDTHS.content,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: { gap: spacing.md, marginBottom: spacing.lg },
});
