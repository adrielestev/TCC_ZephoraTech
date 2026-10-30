import { Stack } from "expo-router";
import { BackButton } from "@/components/BackButton";
import { colors } from "@/theme/tokens";

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surfaceMuted },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: "800" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Perfil" }} />
      <Stack.Screen
        name="edit"
        options={{
          title: "Editar perfil",
          headerLeft: () => <BackButton destination="profile" />,
        }}
      />
    </Stack>
  );
}
