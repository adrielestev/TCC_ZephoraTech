import { ActivityIndicator, Pressable, PressableProps, Text } from "react-native";
import { colors, radii } from "../theme/tokens";

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
          minHeight: 52,
          paddingHorizontal: 18,
          borderRadius: radii.button,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? colors.primaryPressed : colors.primary,
          opacity: disabled || loading ? 0.55 : 1,
          shadowColor: "#244D70",
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{label}</Text>
      )}
    </Pressable>
  );
}
