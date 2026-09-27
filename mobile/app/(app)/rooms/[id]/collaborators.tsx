import { useDeferredValue, useState } from "react";
import { Alert, View, Text, FlatList, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
  useAddCollaborator,
  useCollaborators,
  useRemoveCollaborator,
} from "../../../../src/hooks/useRooms";
import { usersApi } from "../../../../src/api/users";
import { FormField } from "../../../../src/components/FormField";
import { colors, radii, spacing } from "../../../../src/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { LoadingState } from "../../../../src/components/LoadingState";
import { ErrorState } from "../../../../src/components/ErrorState";
import { EmptyState } from "../../../../src/components/EmptyState";

export default function RoomCollaboratorsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const { data: collaborators, isLoading, isError, refetch } = useCollaborators(roomId);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
  } = useQuery({
    queryKey: ["users", "collaborator-search", deferredSearch],
    queryFn: async () => (await usersApi.list({ q: deferredSearch, limit: 5 })).data.users,
    enabled: deferredSearch.length >= 2,
  });
  const addCollaborator = useAddCollaborator(roomId);
  const removeCollaborator = useRemoveCollaborator(roomId);

  async function handleAdd(userId: number) {
    setMessage(null);
    try {
      await addCollaborator.mutateAsync(userId);
      setSearch("");
      setMessage("Colaborador adicionado.");
    } catch {
      setMessage("Não foi possível adicionar este usuário.");
    }
  }

  function handleRemove(collaboratorId: number) {
    Alert.alert("Remover colaborador", "Deseja remover este acesso à sala?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () =>
          removeCollaborator.mutate(collaboratorId, {
            onError: () => setMessage("Não foi possível remover este colaborador."),
          }),
      },
    ]);
  }

  const collaboratorIds = new Set(
    (collaborators ?? []).map((collaborator) => collaborator.user_id),
  );
  const matches =
    deferredSearch.length < 2
      ? []
      : (users ?? [])
          .filter(
            (user) =>
              !collaboratorIds.has(user.id) &&
              (user.name.toLowerCase().includes(deferredSearch) ||
                user.email.toLowerCase().includes(deferredSearch)),
          )
          .slice(0, 5);

  if (isLoading) {
    return <LoadingState label="Carregando colaboradores..." />;
  }

  if (isError) {
    return (
      <ErrorState message="Não foi possível carregar os colaboradores." onRetry={() => refetch()} />
    );
  }

  return (
    <LinearGradient colors={[colors.backgroundTop, colors.backgroundBottom]} style={{ flex: 1 }}>
      <FlatList
        data={collaborators}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 32 }}
        ListHeaderComponent={
          <View style={{ gap: 8, marginBottom: 12 }}>
            <FormField
              label="Adicionar colaborador"
              placeholder="Nome ou e-mail"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {matches.map((user) => (
              <Pressable
                key={user.id}
                onPress={() => handleAdd(user.id)}
                disabled={addCollaborator.isPending}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radii.field,
                  padding: 12,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={{ fontWeight: "800", color: colors.ink }}>{user.name}</Text>
                <Text style={{ color: colors.muted }}>{user.email}</Text>
              </Pressable>
            ))}
            {deferredSearch.length >= 2 && usersLoading && (
              <Text style={{ color: colors.muted }}>Buscando usuários...</Text>
            )}
            {deferredSearch.length >= 2 && !usersLoading && matches.length === 0 && (
              <Text style={{ color: colors.muted }}>Nenhum usuário encontrado.</Text>
            )}
            {usersError && (
              <Text accessibilityRole="alert" style={{ color: colors.error }}>
                Não foi possível buscar usuários.
              </Text>
            )}
            {message && (
              <Text
                style={{
                  color: message.includes("não") ? colors.error : colors.success,
                  fontWeight: "600",
                }}
              >
                {message}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.card,
              padding: 16,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "700" }}>
              {item.name ?? `Usuário #${item.user_id}`}
            </Text>
            <Pressable onPress={() => handleRemove(item.id)}>
              <Text style={{ color: colors.error, fontWeight: "700" }}>Remover</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="person-add-outline" message="Nenhum colaborador ainda." />
        }
      />
    </LinearGradient>
  );
}
