import { View, Text, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import { resolveMediaUrl } from "../../../src/api/client";
import { Screen } from "../../../src/components/Screen";
import { SurfaceCard } from "../../../src/components/SurfaceCard";
import { colors, radii, spacing } from "../../../src/theme/tokens";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", gap: spacing.lg }}>
      <SurfaceCard>
        <View style={{ alignItems: "center", gap: spacing.sm }}>
          {user?.user_photo ? (
            <Image
              source={{ uri: resolveMediaUrl(user.user_photo) ?? undefined }}
              accessibilityLabel="Foto de perfil"
              style={{ width: 96, height: 96, borderRadius: 48 }}
            />
          ) : (
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: "#DCECFB",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 32, fontWeight: "800" }}>
                {user?.name?.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.ink }}>{user?.name}</Text>
          <Text style={{ color: colors.muted }}>{user?.email}</Text>
        </View>

        <Pressable
          onPress={() => router.push("/(app)/profile/edit")}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.button,
            padding: 15,
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: "800" }}>Editar dados</Text>
        </Pressable>

        <Pressable
          onPress={signOut}
          style={{
            borderWidth: 1,
            borderColor: "#F1C8C4",
            borderRadius: radii.button,
            padding: 15,
            alignItems: "center",
            marginTop: spacing.sm,
          }}
        >
          <Text style={{ color: colors.error, fontWeight: "800" }}>Sair</Text>
        </Pressable>
      </SurfaceCard>
    </Screen>
  );
}
