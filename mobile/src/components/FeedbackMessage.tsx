import { Ionicons } from "@expo/vector-icons";
import { Text, Animated } from "react-native";
import { useEffect, useState } from "react";
import { colors, radii, spacing, typography } from "../theme/tokens";

type FeedbackVariant = "error" | "success" | "info";

interface FeedbackMessageProps {
  message: string;
  variant?: FeedbackVariant;
  autoDismiss?: boolean;
  duration?: number;
  onDismiss?: () => void;
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

export function FeedbackMessage({
  message,
  variant = "error",
  autoDismiss = true,
  duration = 3000,
  onDismiss,
}: FeedbackMessageProps) {
  const style = variantStyles[variant];
  const [isVisible, setIsVisible] = useState(true);
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(10));

  useEffect(() => {
    setIsVisible(true);

    // Animação de entrada
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    let timeout: ReturnType<typeof setTimeout>;
    if (autoDismiss) {
      timeout = setTimeout(() => {
        // Animação de saída
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 10,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsVisible(false);
          onDismiss?.();
        });
      }, duration);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [message, variant, autoDismiss, duration, onDismiss, opacity, translateY]);

  if (!isVisible) return null;

  return (
    <Animated.View
      accessibilityRole={variant === "error" ? "alert" : undefined}
      accessibilityLiveRegion={variant === "error" ? "assertive" : "polite"}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.sm,
        padding: spacing.sm,
        borderRadius: radii.field,
        backgroundColor: style.backgroundColor,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <Ionicons name={style.icon} size={20} color={style.color} accessibilityLabel={variant} />
      <Text style={{ ...typography.body, flex: 1, color: style.color }}>{message}</Text>
    </Animated.View>
  );
}
