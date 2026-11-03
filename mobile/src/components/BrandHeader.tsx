import { Image, Text, View } from "react-native";
import { colors, spacing } from "../theme/tokens";

export function BrandHeader() {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Logo Zephora"
      style={{ alignItems: "center", gap: spacing.sm }}
    >
      <Image
        source={require("@/assets/images/Logo-zephora.png")}
        style={{ width: 86, height: 60 }}
        resizeMode="contain"
      />
      <Text style={{ color: colors.ink, fontSize: 22, fontWeight: "800", letterSpacing: 1.2 }}>
        ZEPHORA
      </Text>
    </View>
  );
}
