import { ActivityIndicator, Pressable, PressableProps, Text } from "react-native";
import { colors, layout, radii, shadows, typography } from "../theme/tokens";

interface PrimaryButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
}

export function PrimaryButton({ label, loading = false, disabled, ...props }: PrimaryButtonProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        {
          minHeight: layout.minTouchTarget + 8,
          paddingHorizontal: 18,
          borderRadius: radii.button,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? colors.primaryPressed : colors.primary,
          opacity: disabled || loading ? 0.55 : 1,
          ...shadows.button,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={{ ...typography.bodyStrong, color: colors.white }}>{label}</Text>
      )}
    </Pressable>
  );
}
