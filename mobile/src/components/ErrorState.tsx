import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { colors, layout, radii, shadows, spacing, typography } from "../theme/tokens";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({
  message,
  onRetry,
  title = "Não foi possível concluir",
}: ErrorStateProps) {
  return (
    <View
      accessible
      accessibilityRole="alert"
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
        padding: spacing.lg,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.errorSoft,
        }}
      >
        <Ionicons
          name="alert-circle-outline"
          size={34}
          color={colors.error}
          accessibilityLabel="Erro"
        />
      </View>
      <View
        style={{
          width: "100%",
          maxWidth: layout.formMaxWidth,
          alignItems: "center",
          gap: spacing.xs,
        }}
      >
        <Text style={{ ...typography.title, color: colors.ink, textAlign: "center" }}>{title}</Text>
        <Text style={{ ...typography.body, color: colors.text, textAlign: "center" }}>
          {message}
        </Text>
      </View>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Tentar novamente"
          hitSlop={8}
          style={({ pressed }) => ({
            minHeight: layout.minTouchTarget,
            paddingHorizontal: spacing.md,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            borderRadius: radii.button,
            backgroundColor: pressed ? colors.primaryPressed : colors.primary,
            ...shadows.button,
          })}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.white} />
          <Text style={{ ...typography.bodyStrong, color: colors.white }}>Tentar novamente</Text>
        </Pressable>
      )}
    </View>
  );
}
