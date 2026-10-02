import { ReactNode } from "react";
import { View } from "react-native";
import { colors, layout, radii, shadows, spacing } from "../theme/tokens";

export function SurfaceCard({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        width: "100%",
        maxWidth: layout.formMaxWidth,
        alignSelf: "center",
        padding: spacing.lg,
        gap: spacing.md,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.9)",
        backgroundColor: colors.surface,
        ...shadows.card,
      }}
    >
      {children}
    </View>
  );
}
