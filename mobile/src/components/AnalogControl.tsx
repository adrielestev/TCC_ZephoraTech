import { Text, View } from "react-native";
import { IconButton } from "./IconButton";
import { colors, spacing } from "../theme/tokens";

interface AnalogControlProps {
  label: string;
  value: number;
  pending?: boolean;
  onChange: (value: number) => void;
}

export function AnalogControl({ label, value, pending = false, onChange }: AnalogControlProps) {
  const decrease = () => onChange(Math.max(0, value - 5));
  const increase = () => onChange(Math.min(100, value + 5));

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}%`}
      accessibilityValue={{ min: 0, max: 100, now: value }}
      style={{ alignItems: "center", gap: spacing.xs }}
    >
      <Text style={{ color: colors.text, fontWeight: "800" }}>
        {pending ? "Atualizando..." : `${value}%`}
      </Text>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <IconButton
          icon="remove-outline"
          label={`Reduzir ${label}`}
          disabled={pending || value <= 0}
          onPress={decrease}
        />
        <IconButton
          icon="add-outline"
          label={`Aumentar ${label}`}
          disabled={pending || value >= 100}
          onPress={increase}
        />
      </View>
    </View>
  );
}
