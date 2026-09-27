import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { colors, spacing } from "../theme/tokens";

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
      <Ionicons name={icon} size={30} color={colors.muted} accessibilityLabel="Nenhum item" />
      <Text style={{ color: colors.muted, textAlign: "center" }}>{message}</Text>
    </View>
  );
}
