import { ActivityIndicator, Text, View } from "react-native";
import { colors, spacing } from "../theme/tokens";

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        padding: spacing.lg,
      }}
    >
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.muted }}>{label}</Text>
    </View>
  );
}
