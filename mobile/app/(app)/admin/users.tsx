import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { useDeferredValue, useEffect, useState } from "react";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../../../src/api/users";
import { useAuth } from "../../../src/context/AuthContext";
import { UserLevel } from "../../../src/types";
import { colors, layout, radii, shadows, spacing, typography } from "../../../src/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { LoadingState } from "../../../src/components/LoadingState";
import { ErrorState } from "../../../src/components/ErrorState";
import { EmptyState } from "../../../src/components/EmptyState";
import { FormField } from "../../../src/components/FormField";
import { confirmAction } from "../../../src/utils/confirm-action";
import { FeedbackMessage } from "../../../src/components/FeedbackMessage";

export default function AdminUsersScreen() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const searchQuery = deferredSearch.length >= 2 ? deferredSearch : undefined;

  async function handleRefresh() {
    setIsManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/(app)");
    }
  }, [isAdmin]);

  const {
    data: users,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["users", "admin", searchQuery],
    queryFn: async () =>
      (await usersApi.list(searchQuery ? { q: searchQuery, limit: 50 } : undefined)).data.users,
    enabled: deferredSearch.length === 0 || deferredSearch.length >= 2,
  });

  async function confirmLevel(userId: number, currentLevel: UserLevel) {
    if (user?.id === userId && currentLevel === "ADMIN") {
      setActionError("Você não pode remover seus próprios privilégios de administrador.");
      return;
    }

    const nextLevel = currentLevel === "ADMIN" ? "USER" : "ADMIN";
    if (
      !(await confirmAction("Alterar permissão", `Deseja alterar este usuário para ${nextLevel}?`))
    )
      return;
    setActionError(null);
    updateLevel.mutate(
      { userId, level: nextLevel },
      { onError: () => setActionError("Não foi possível alterar a permissão do usuário.") },
    );
  }

  async function confirmDelete(userId: number) {
    if (user && userId === user.id) {
      setActionError("Você não pode remover sua própria conta de administrador.");
      return;
    }

    if (!(await confirmAction("Remover usuário", "O usuário será desativado."))) return;
    setActionError(null);
    softDelete.mutate(userId, {
      onError: () => setActionError("Não foi possível remover o usuário."),
    });
  }

  const updateLevel = useMutation({
    mutationFn: ({ userId, level }: { userId: number; level: UserLevel }) =>
      usersApi.updateLevel(userId, level),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    onError: () => setActionError("Não foi possível alterar a permissão do usuário."),
  });

  const softDelete = useMutation({
    mutationFn: (userId: number) => usersApi.softDelete(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    onError: () => setActionError("Não foi possível remover o usuário."),
  });

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Acesso negado</Text>
        <Text style={{ color: "#667085", textAlign: "center", marginTop: 8 }}>
          Esta área é exclusiva para administradores.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return <LoadingState label="Carregando usuários..." />;
  }

  if (isError) {
    return (
      <ErrorState message="Não foi possível carregar os usuários." onRetry={() => refetch()} />
    );
  }

  return (
    <LinearGradient colors={[colors.backgroundTop, colors.backgroundBottom]} style={{ flex: 1 }}>
      <FlatList
        data={users}
        refreshControl={
          <RefreshControl
            refreshing={isManualRefreshing && isRefetching}
            onRefresh={handleRefresh}
          />
        }
        keyExtractor={(u) => String(u.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 32 }}
        ListHeaderComponentStyle={{
          width: "100%",
          maxWidth: layout.contentMaxWidth,
          alignSelf: "center",
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.sm }}>
            <Text style={{ ...typography.display, color: colors.ink }}>Usuários</Text>
            <Text style={{ ...typography.body, color: colors.muted, marginTop: spacing.xs }}>
              Gerencie acessos e permissões da plataforma.
            </Text>
            <FormField
              label="Buscar usuário"
              placeholder="Nome ou e-mail"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {deferredSearch.length === 1 && (
              <Text style={{ color: colors.muted, marginTop: 6 }}>
                Digite pelo menos 2 caracteres.
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              width: "100%",
              maxWidth: layout.contentMaxWidth,
              alignSelf: "center",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.card,
              padding: spacing.lg,
              gap: spacing.md,
              backgroundColor: colors.surface,
              ...shadows.card,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.primarySoft,
                }}
              >
                <Text style={{ ...typography.bodyStrong, color: colors.primary }}>
                  {item.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ ...typography.bodyStrong, color: colors.ink }}>{item.name}</Text>
                <Text style={{ ...typography.caption, color: colors.muted }}>{item.email}</Text>
              </View>
              <View
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 5,
                  borderRadius: radii.pill,
                  backgroundColor:
                    item.user_level === "ADMIN" ? colors.primarySoft : colors.surfaceMuted,
                }}
              >
                <Text
                  style={{
                    ...typography.caption,
                    color: item.user_level === "ADMIN" ? colors.primary : colors.muted,
                  }}
                >
                  {item.user_level}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  item.user_level === "ADMIN"
                    ? user?.id === item.id
                      ? `Não é possível rebaixar ${item.name}`
                      : `Rebaixar ${item.name}`
                    : `Promover ${item.name}`
                }
                accessibilityState={{
                  disabled:
                    (user?.id === item.id && item.user_level === "ADMIN") ||
                    (updateLevel.isPending && updateLevel.variables?.userId === item.id),
                }}
                disabled={
                  (user?.id === item.id && item.user_level === "ADMIN") ||
                  (updateLevel.isPending && updateLevel.variables?.userId === item.id)
                }
                onPress={() => confirmLevel(item.id, item.user_level)}
                style={({ pressed }) => ({
                  minHeight: layout.minTouchTarget,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radii.button,
                  justifyContent: "center",
                  backgroundColor:
                    user?.id === item.id && item.user_level === "ADMIN"
                      ? colors.surfaceMuted
                      : colors.primarySoft,
                  opacity:
                    (user?.id === item.id && item.user_level === "ADMIN") ||
                    (updateLevel.isPending && updateLevel.variables?.userId === item.id)
                      ? 0.5
                      : pressed
                        ? 0.72
                        : 1,
                })}
              >
                <Text
                  style={{
                    ...typography.caption,
                    color:
                      user?.id === item.id && item.user_level === "ADMIN"
                        ? colors.muted
                        : colors.primary,
                  }}
                >
                  {updateLevel.isPending && updateLevel.variables?.userId === item.id
                    ? "Alterando..."
                    : user?.id === item.id && item.user_level === "ADMIN"
                      ? "Sua conta"
                      : item.user_level === "ADMIN"
                        ? "Rebaixar para USER"
                        : "Promover a ADMIN"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  user?.id === item.id ? `Conta de ${item.name}` : `Remover ${item.name}`
                }
                disabled={
                  user?.id === item.id || (softDelete.isPending && softDelete.variables === item.id)
                }
                onPress={() => confirmDelete(item.id)}
                style={({ pressed }) => ({
                  minHeight: layout.minTouchTarget,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radii.button,
                  justifyContent: "center",
                  backgroundColor: user?.id === item.id ? colors.surfaceMuted : colors.errorSoft,
                  opacity:
                    user?.id === item.id ||
                    (softDelete.isPending && softDelete.variables === item.id)
                      ? 0.45
                      : pressed
                        ? 0.72
                        : 1,
                })}
              >
                <Text
                  style={{
                    color: user?.id === item.id ? colors.muted : colors.error,
                    ...typography.caption,
                  }}
                >
                  {softDelete.isPending && softDelete.variables === item.id
                    ? "Removendo..."
                    : user?.id === item.id
                      ? "Você"
                      : "Remover"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={actionError ? <FeedbackMessage message={actionError} /> : null}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            message={searchQuery ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado."}
          />
        }
      />
    </LinearGradient>
  );
}
