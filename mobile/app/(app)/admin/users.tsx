import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { useDeferredValue, useEffect, useState } from "react";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../../../src/api/users";
import { useAuth } from "../../../src/context/AuthContext";
import { UserLevel } from "../../../src/types";
import { colors, radii, spacing } from "../../../src/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { LoadingState } from "../../../src/components/LoadingState";
import { ErrorState } from "../../../src/components/ErrorState";
import { EmptyState } from "../../../src/components/EmptyState";
import { FormField } from "../../../src/components/FormField";
import { confirmAction } from "../../../src/utils/confirm-action";

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
    const nextLevel = currentLevel === "ADMIN" ? "USER" : "ADMIN";
    if (!(await confirmAction("Alterar permissão", `Deseja alterar este usuário para ${nextLevel}?`))) return;
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
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.sm }}>
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
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.card,
              padding: spacing.md,
              gap: 8,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ fontWeight: "800", color: colors.ink }}>{item.name}</Text>
            <Text style={{ color: colors.muted }}>{item.email}</Text>
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
              <Pressable
                disabled={updateLevel.isPending && updateLevel.variables?.userId === item.id}
                onPress={() => confirmLevel(item.id, item.user_level)}
                style={{
                  opacity:
                    updateLevel.isPending && updateLevel.variables?.userId === item.id ? 0.5 : 1,
                }}
              >
                <Text>
                  {updateLevel.isPending && updateLevel.variables?.userId === item.id
                    ? "Alterando..."
                    : item.user_level === "ADMIN"
                      ? "Rebaixar para USER"
                      : "Promover a ADMIN"}
                </Text>
              </Pressable>
              <Pressable
                disabled={
                  user?.id === item.id || (softDelete.isPending && softDelete.variables === item.id)
                }
                onPress={() => confirmDelete(item.id)}
                style={{
                  opacity:
                    user?.id === item.id ||
                    (softDelete.isPending && softDelete.variables === item.id)
                      ? 0.45
                      : 1,
                }}
              >
                <Text
                  style={{
                    color: user?.id === item.id ? colors.muted : colors.error,
                    fontWeight: "700",
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
        ListFooterComponent={
          actionError ? (
            <Text accessibilityRole="alert" style={{ color: colors.error, paddingTop: 8 }}>
              {actionError}
            </Text>
          ) : null
        }
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
