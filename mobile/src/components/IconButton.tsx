import { Ionicons } from "@expo/vector-icons";
import { Pressable, PressableProps } from "react-native";
import { colors, layout, radii } from "../theme/tokens";

type IconButtonProps = Omit<PressableProps, "children"> & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  destructive?: boolean;
};

export function IconButton({
  icon,
  label,
  destructive = false,
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
      style={({ pressed }) => ({
        width: layout.minTouchTarget,
        height: layout.minTouchTarget,
        borderRadius: radii.field,
        borderWidth: 1,
        borderColor: destructive ? "#E8B8B3" : colors.border,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: destructive ? colors.errorSoft : colors.surfaceMuted,
        opacity: disabled ? 0.4 : pressed ? 0.62 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={destructive ? colors.error : colors.primary} />
    </Pressable>
  );
}
