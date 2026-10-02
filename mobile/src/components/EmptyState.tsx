import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { colors, radii, spacing, typography } from "../theme/tokens";

export function EmptyState({
  icon = "file-tray-outline",
  message,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        padding: spacing.xl,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radii.card,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surfaceAccent,
        }}
      >
        <Ionicons name={icon} size={30} color={colors.primary} accessibilityLabel="Nenhum item" />
      </View>
      <Text style={{ ...typography.body, color: colors.muted, textAlign: "center" }}>
        {message}
      </Text>
    </View>
  );
}
