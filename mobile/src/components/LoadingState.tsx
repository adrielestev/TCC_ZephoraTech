import { ActivityIndicator, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "../theme/tokens";

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
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
      <Text style={{ ...typography.body, color: colors.muted }}>{label}</Text>
    </View>
  );
}
