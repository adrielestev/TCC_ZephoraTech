import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { colors, radii, spacing, typography } from "../theme/tokens";

type FeedbackVariant = "error" | "success" | "info";

interface FeedbackMessageProps {
  message: string;
  variant?: FeedbackVariant;
}

const variantStyles = {
  error: {
    icon: "alert-circle-outline" as const,
    color: colors.error,
    backgroundColor: colors.errorSoft,
  },
  success: {
    icon: "checkmark-circle-outline" as const,
    color: colors.success,
    backgroundColor: colors.successSoft,
  },
  info: {
    icon: "information-circle-outline" as const,
    color: colors.primary,
    backgroundColor: colors.primarySoft,
  },
} as const;

export function FeedbackMessage({ message, variant = "error" }: FeedbackMessageProps) {
  const style = variantStyles[variant];

  return (
    <View
      accessibilityRole={variant === "error" ? "alert" : undefined}
      accessibilityLiveRegion={variant === "error" ? "assertive" : "polite"}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.sm,
        padding: spacing.sm,
        borderRadius: radii.field,
        backgroundColor: style.backgroundColor,
      }}
    >
      <Ionicons name={style.icon} size={20} color={style.color} accessibilityLabel={variant} />
      <Text style={{ ...typography.body, flex: 1, color: style.color }}>{message}</Text>
    </View>
  );
}
