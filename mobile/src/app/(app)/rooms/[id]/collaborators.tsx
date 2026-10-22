import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { useAddCollaborator, useCollaborators, useRemoveCollaborator } from "@/hooks/useRooms";
import { FormField } from "@/components/FormField";
import { Screen } from "@/components/Screen";
import { SurfaceCard } from "@/components/SurfaceCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { FeedbackMessage } from "@/components/FeedbackMessage";
import { colors, layout, radii, spacing, typography } from "@/theme/tokens";
import { confirmAction } from "@/utils/confirm-action";

export default function RoomCollaboratorsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());
  const { data: collaborators, isLoading, isError, refetch } = useCollaborators(roomId);
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users", "collaborators"],
    queryFn: async () => (await usersApi.list()).data.users,
    enabled: isAdmin,
  });
  const addCollaborator = useAddCollaborator(roomId);
  const removeCollaborator = useRemoveCollaborator(roomId);
  useEffect(() => {
    if (!isAdmin) router.replace("/(app)");
  }, [isAdmin]);

  const existingIds = useMemo(
    () => new Set((collaborators ?? []).map((item) => item.user_id)),
    [collaborators],
  );
  const matches = (users ?? [])
    .filter(
      (item) =>
        item.user_level === "user" &&
        !existingIds.has(item.id) &&
        `${item.name} ${item.email}`.toLocaleLowerCase().includes(deferredSearch),
    )
    .slice(0, 8);

  async function handleAdd(userId: number) {
    setMessage(null);
    try {
      await addCollaborator.mutateAsync(userId);
      setSearch("");
      setMessage({ text: "Colaborador adicionado." });
    } catch {
      setMessage({ text: "Não foi possível adicionar este usuário.", error: true });
    }
  }

  async function handleRemove(collaboratorId: number) {
    if (
      !(await confirmAction("Remover colaborador", "Deseja remover o acesso desta pessoa à sala?"))
    )
      return;
    try {
      await removeCollaborator.mutateAsync(collaboratorId);
    } catch {
      setMessage({ text: "Não foi possível remover este colaborador.", error: true });
    }
  }

  if (!isAdmin) return null;
  if (isLoading) return <LoadingState label="Carregando colaboradores..." />;
  if (isError)
    return (
      <ErrorState message="Não foi possível carregar os colaboradores." onRetry={() => refetch()} />
    );

  return (
    <Screen scroll={false}>
      <FlatList
        data={collaborators ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          width: "100%",
          maxWidth: layout.contentMaxWidth,
          alignSelf: "center",
          padding: spacing.md,
          gap: spacing.sm,
          paddingBottom: spacing.xl,
        }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            <Text style={{ ...typography.title, color: colors.ink }}>Colaboradores da sala</Text>
            <FormField
              label="Adicionar usuário"
              placeholder="Nome ou e-mail"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {deferredSearch.length > 0 && usersLoading && (
              <Text style={{ color: colors.muted }}>Carregando usuários...</Text>
            )}
            {deferredSearch.length > 0 &&
              !usersLoading &&
              matches.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleAdd(item.id)}
                  disabled={addCollaborator.isPending}
                  style={({ pressed }) => ({
                    minHeight: layout.minTouchTarget,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radii.field,
                    padding: spacing.md,
                    backgroundColor: pressed ? colors.surfaceAccent : colors.surface,
                  })}
                >
                  <Text style={{ ...typography.bodyStrong, color: colors.ink }}>{item.name}</Text>
                  <Text style={{ ...typography.caption, color: colors.muted }}>{item.email}</Text>
                </Pressable>
              ))}
            {deferredSearch.length > 0 && !usersLoading && matches.length === 0 && (
              <Text style={{ color: colors.muted }}>Nenhum usuário disponível.</Text>
            )}
            {message && (
              <FeedbackMessage
                message={message.text}
                variant={message.error ? "error" : "success"}
              />
            )}
            <Text style={{ ...typography.section, color: colors.text }}>Acesso à sala</Text>
          </View>
        }
        renderItem={({ item }) => (
          <SurfaceCard>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ ...typography.bodyStrong, color: colors.ink }}>{item.name}</Text>
              <Text style={{ ...typography.caption, color: colors.muted }}>{item.email}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => handleRemove(item.id)}
              disabled={removeCollaborator.isPending}
              style={({ pressed }) => ({
                minHeight: layout.minTouchTarget,
                justifyContent: "center",
                alignSelf: "flex-start",
                paddingHorizontal: spacing.sm,
                opacity: pressed || removeCollaborator.isPending ? 0.6 : 1,
              })}
            >
              <Text style={{ ...typography.bodyStrong, color: colors.error }}>Remover</Text>
            </Pressable>
          </SurfaceCard>
        )}
        ListEmptyComponent={
          <EmptyState icon="person-add-outline" message="Nenhum colaborador ainda." />
        }
      />
    </Screen>
  );
}
