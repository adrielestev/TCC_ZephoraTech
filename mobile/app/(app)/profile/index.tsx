import { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import { resolveMediaUrl } from "../../../src/api/client";
import { Screen } from "../../../src/components/Screen";
import { SurfaceCard } from "../../../src/components/SurfaceCard";
import { ImageViewerModal } from "../../../src/components/ImageViewerModal";
import { colors, layout, radii, spacing, typography } from "../../../src/theme/tokens";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [isPhotoViewerVisible, setIsPhotoViewerVisible] = useState(false);
  const photoUri = user?.user_photo ? resolveMediaUrl(user.user_photo) : null;

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", gap: spacing.lg }}>
      <SurfaceCard>
        <View style={{ alignItems: "center", gap: spacing.sm }}>
          {photoUri ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ampliar foto de perfil"
              onPress={() => setIsPhotoViewerVisible(true)}
              style={({ pressed }) => ({
                borderRadius: 52,
                padding: 4,
                backgroundColor: colors.primarySoft,
                opacity: pressed ? 0.82 : 1,
              })}
            >
              <Image
                source={{ uri: photoUri }}
                accessibilityLabel="Foto de perfil"
                style={{ width: 96, height: 96, borderRadius: 48 }}
              />
            </Pressable>
          ) : (
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: colors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 32, fontWeight: "800" }}>
                {user?.name?.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={{ ...typography.title, color: colors.ink }}>{user?.name}</Text>
          <Text style={{ ...typography.body, color: colors.muted }}>{user?.email}</Text>
        </View>

        <Pressable
          onPress={() => router.push("/(app)/profile/edit")}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.button,
            minHeight: layout.minTouchTarget,
            paddingHorizontal: spacing.md,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: "800" }}>Editar dados</Text>
        </Pressable>

        <Pressable
          onPress={signOut}
          style={{
            borderWidth: 1,
            borderColor: colors.errorSoft,
            borderRadius: radii.button,
            minHeight: layout.minTouchTarget,
            paddingHorizontal: spacing.md,
            justifyContent: "center",
            alignItems: "center",
            marginTop: spacing.sm,
          }}
        >
          <Text style={{ color: colors.error, fontWeight: "800" }}>Sair</Text>
        </Pressable>
        <ImageViewerModal
          visible={isPhotoViewerVisible}
          uri={photoUri}
          label="Foto de perfil ampliada"
          onClose={() => setIsPhotoViewerVisible(false)}
        />
      </SurfaceCard>
    </Screen>
  );
}
