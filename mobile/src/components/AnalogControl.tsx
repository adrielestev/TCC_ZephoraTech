import { Text, View } from "react-native";
import { IconButton } from "./IconButton";
import { colors, spacing } from "../theme/tokens";

interface AnalogControlProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  pending?: boolean;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function AnalogControl({
  label,
  value,
  min = 0,
  max = 100,
  step = 5,
  pending = false,
  disabled = false,
  onChange,
}: AnalogControlProps) {
  const decrease = () => {
    if (value <= min) {
      onChange(0);
      return;
    }
    const nextValue = value - step;
    onChange(nextValue <= min ? min : nextValue);
  };
  const increase = () => onChange(value === 0 && min > 0 ? min : Math.min(max, value + step));
  const progress = value === 0 ? 0 : max > min ? ((value - min) / (max - min)) * 100 : 100;

  return (
    <View style={{ alignItems: "center", gap: spacing.sm, width: "100%" }}>
      <Text
        accessibilityLabel={`${label}: ${value}%`}
        style={{ color: colors.text, fontWeight: "800" }}
      >
        {pending ? "Atualizando..." : `${value}%`}
      </Text>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: "100%",
          maxWidth: 320,
          height: 8,
          overflow: "hidden",
          borderRadius: 999,
          backgroundColor: colors.border,
        }}
      >
        <View
          style={{
            width: `${Math.max(0, Math.min(100, progress))}%`,
            height: "100%",
            borderRadius: 999,
            backgroundColor: colors.primary,
          }}
        />
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <IconButton
          icon="remove-outline"
          label={`Reduzir ${label}`}
          disabled={pending || disabled || value <= 0}
          onPress={decrease}
        />
        <IconButton
          icon="add-outline"
          label={`Aumentar ${label}`}
          disabled={pending || disabled || value >= max}
          onPress={increase}
        />
      </View>
    </View>
  );
}
