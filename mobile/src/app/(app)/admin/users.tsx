import { useDeferredValue, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { FormField } from "@/components/FormField";
import { Screen } from "@/components/Screen";
import { SurfaceCard } from "@/components/SurfaceCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { colors, layout, radii, spacing, typography } from "@/theme/tokens";

export default function AdminUsersScreen() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());
  const {
    data: users,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["users", "admin"],
    queryFn: async () => (await usersApi.list()).data.users,
    enabled: isAdmin,
  });
  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: "admin" | "user" }) =>
      usersApi.updateLevel(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "admin"] }),
  });

  useEffect(() => {
    if (!isAdmin) router.replace("/(app)");
  }, [isAdmin]);

  if (!isAdmin) return null;
  if (isLoading) return <LoadingState label="Carregando usuários..." />;
  if (isError)
    return <ErrorState message="Não foi possível carregar usuários." onRetry={() => refetch()} />;

  const filtered = (users ?? []).filter((item) =>
    `${item.name} ${item.email}`.toLocaleLowerCase().includes(deferredSearch),
  );

  return (
    <Screen scroll={false}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListHeaderComponent={
          <View
            style={{
              width: "100%",
              maxWidth: layout.contentMaxWidth,
              alignSelf: "center",
              marginBottom: spacing.sm,
              gap: spacing.md,
            }}
          >
            <Text style={{ ...typography.title, color: colors.ink }}>Usuários</Text>
            <FormField
              label="Buscar"
              placeholder="Nome ou e-mail"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
          </View>
        }
        renderItem={({ item }) => {
          const isSelf = item.id === user?.id;
          const nextRole = item.user_level === "admin" ? "user" : "admin";
          return (
            <SurfaceCard>
              <View style={{ gap: 3 }}>
                <Text style={{ ...typography.bodyStrong, color: colors.ink }}>
                  {item.name}
                  {isSelf ? " (você)" : ""}
                </Text>
                <Text style={{ ...typography.body, color: colors.muted }}>{item.email}</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: spacing.md,
                }}
              >
                <View
                  style={{
                    backgroundColor:
                      item.user_level === "admin" ? colors.primarySoft : colors.surfaceMuted,
                    borderRadius: radii.pill,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 5,
                  }}
                >
                  <Text
                    style={{
                      ...typography.caption,
                      color: item.user_level === "admin" ? colors.primary : colors.muted,
                    }}
                  >
                    {item.user_level === "admin" ? "Administrador" : "Usuário"}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${nextRole === "admin" ? "Promover" : "Rebaixar"} ${item.name}`}
                  disabled={isSelf || updateRole.isPending}
                  onPress={() => updateRole.mutate({ id: item.id, role: nextRole })}
                  style={({ pressed }) => ({
                    minHeight: layout.minTouchTarget,
                    justifyContent: "center",
                    paddingHorizontal: spacing.sm,
                    borderRadius: radii.button,
                    backgroundColor: colors.surfaceAccent,
                    opacity: isSelf || updateRole.isPending ? 0.5 : pressed ? 0.75 : 1,
                  })}
                >
                  <Text style={{ ...typography.caption, color: colors.primary }}>
                    {isSelf
                      ? "Conta atual"
                      : nextRole === "admin"
                        ? "Promover a admin"
                        : "Remover admin"}
                  </Text>
                </Pressable>
              </View>
              {updateRole.isError && updateRole.variables?.id === item.id && (
                <Text accessibilityRole="alert" style={{ color: colors.error }}>
                  Não foi possível alterar o perfil.
                </Text>
              )}
            </SurfaceCard>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="people-outline" message="Nenhum usuário encontrado." />
        }
      />
    </Screen>
  );
}
