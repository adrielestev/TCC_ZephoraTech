import { Ionicons } from "@expo/vector-icons";
import { Pressable, PressableProps } from "react-native";
import { colors, radii } from "../theme/tokens";

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
        width: 42,
        height: 42,
        borderRadius: radii.field,
        borderWidth: 1,
        borderColor: destructive ? "#F1C8C4" : colors.border,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: destructive ? "#FFF8F7" : "rgba(255,255,255,0.75)",
        opacity: disabled ? 0.4 : pressed ? 0.62 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={destructive ? colors.error : colors.primary} />
    </Pressable>
  );
}
