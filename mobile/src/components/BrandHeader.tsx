import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { colors, spacing } from "../theme/tokens";

export function BrandHeader() {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Logo Zephora"
      style={{ alignItems: "center", gap: spacing.sm }}
    >
      <Ionicons name="home" size={42} color={colors.primary} />
      <Text style={{ color: colors.ink, fontSize: 22, fontWeight: "800", letterSpacing: 1.2 }}>
        ZEPHORA
      </Text>
    </View>
  );
}
