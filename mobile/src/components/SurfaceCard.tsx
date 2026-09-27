import { ReactNode } from "react";
import { View } from "react-native";
import { colors, radii, spacing } from "../theme/tokens";

export function SurfaceCard({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        width: "100%",
        maxWidth: 440,
        alignSelf: "center",
        padding: spacing.xl,
        gap: spacing.md,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.9)",
        backgroundColor: colors.surface,
        shadowColor: "#31516D",
        shadowOpacity: 0.2,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 10 },
        elevation: 4,
      }}
    >
      {children}
    </View>
  );
}
