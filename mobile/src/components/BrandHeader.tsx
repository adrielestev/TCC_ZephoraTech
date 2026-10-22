import { Text, View } from "react-native";
import Logo from "@/assets/images/Logo-zephora.svg";
import { colors, spacing } from "../theme/tokens";

export function BrandHeader() {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Logo Zephora"
      style={{ alignItems: "center", gap: spacing.sm }}
    >
      <Logo width={86} height={60} />
      <Text style={{ color: colors.ink, fontSize: 22, fontWeight: "800", letterSpacing: 1.2 }}>
        ZEPHORA
      </Text>
    </View>
  );
}
