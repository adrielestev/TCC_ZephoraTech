import { router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { colors, layout } from "../theme/tokens";

type BackDestination = "rooms" | "profile" | "room" | "devices";

export function BackButton({ destination }: { destination: BackDestination }) {
  const { id } = useLocalSearchParams<{ id?: string }>();
  let fallback: Href = "/(app)";

  if (destination === "profile") fallback = "/(app)/profile";
  if (destination === "room" && id) fallback = `/(app)/rooms/${id}` as Href;
  if (destination === "devices" && id) fallback = `/(app)/rooms/${id}/devices` as Href;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      hitSlop={8}
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
      style={({ pressed }) => ({
        width: layout.minTouchTarget,
        height: layout.minTouchTarget,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        opacity: pressed ? 0.65 : 1,
        backgroundColor: pressed ? colors.surfaceAccent : "transparent",
      })}
    >
      <Ionicons name="arrow-back" size={22} color={colors.primary} />
    </Pressable>
  );
}
