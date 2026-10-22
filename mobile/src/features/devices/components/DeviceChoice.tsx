import { Pressable, Text } from "react-native";
import { colors, layout, radii, spacing, typography } from "@/theme/tokens";

export function DeviceChoice({ label, selected, disabled = false, onPress }: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => ({
    minHeight: layout.minTouchTarget, justifyContent: "center", paddingHorizontal: spacing.md,
    borderRadius: radii.pill, borderWidth: 1, borderColor: selected ? colors.primary : colors.border,
    backgroundColor: selected ? colors.primarySoft : colors.surface, opacity: disabled ? 0.6 : pressed ? 0.7 : 1,
  })}>
    <Text style={{ ...typography.caption, color: selected ? colors.primary : colors.text }}>{label}</Text>
  </Pressable>;
}
