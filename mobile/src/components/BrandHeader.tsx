import { Image } from "expo-image";
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
      <Image
        source={require("../../assets/images/Logo-zephora.svg")}
        contentFit="contain"
        style={{ width: 58, height: 42 }}
      />
      <Text style={{ color: colors.ink, fontSize: 22, fontWeight: "800", letterSpacing: 1.2 }}>
        ZEPHORA
      </Text>
    </View>
  );
}
