import { Pressable, Text, View } from "react-native";
import { Device } from "@/types";
import { deviceTypeLabels } from "@/utils/deviceRules";
import { colors, layout, radii, spacing, typography } from "@/theme/tokens";

export function AutomationDeviceChoices({ devices, selectedId, onSelect }: {
  devices: Device[];
  selectedId: number;
  onSelect: (device: Device) => void;
}) {
  if (!devices.length) return <Text style={{ ...typography.caption, color: colors.warning }}>Nenhum dispositivo compatível nesta sala. Configure uma entrada ou uma saída primeiro.</Text>;
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
    {devices.map((device) => {
      const selected = selectedId === device.id;
      return <Pressable key={device.id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => onSelect(device)} style={({ pressed }) => ({
        minHeight: layout.minTouchTarget, justifyContent: "center", paddingHorizontal: spacing.md,
        borderRadius: radii.pill, borderWidth: 1, borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primarySoft : colors.surface, opacity: pressed ? 0.72 : 1,
      })}>
        <Text style={{ ...typography.caption, color: selected ? colors.primary : colors.text }}>{device.name} · {deviceTypeLabels[device.type]}</Text>
      </Pressable>;
    })}
  </View>;
}
