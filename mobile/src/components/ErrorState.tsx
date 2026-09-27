import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { colors, radii, spacing } from "../theme/tokens";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        padding: spacing.lg,
      }}
    >
      <Ionicons
        name="alert-circle-outline"
        size={30}
        color={colors.error}
        accessibilityLabel="Erro"
      />
      <Text
        accessibilityRole="alert"
        style={{ color: colors.text, textAlign: "center", lineHeight: 21 }}
      >
        {message}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Tentar novamente"
          hitSlop={8}
          style={({ pressed }) => ({
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radii.button,
            backgroundColor: pressed ? colors.primaryPressed : colors.primary,
          })}
        >
          <Text style={{ color: colors.white, fontWeight: "800" }}>Tentar novamente</Text>
        </Pressable>
      )}
    </View>
  );
}
