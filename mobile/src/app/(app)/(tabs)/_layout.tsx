import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, useWindowDimensions } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { colors, layout } from "@/theme/tokens";

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
      size={focused ? 24 : 22}
      color={focused ? colors.primary : colors.muted}
    />
  );
}

export default function MainTabsLayout() {
  const { isAdmin } = useAuth();
  const { width } = useWindowDimensions();
  const showSidebar = Platform.OS === "web" && width >= layout.desktopBreakpoint;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surfaceMuted },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: "800" },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
        tabBarItemStyle: { paddingTop: 5 },
        tabBarStyle: {
          display: showSidebar ? "none" : "flex",
          height: 68,
          paddingTop: 4,
          backgroundColor: colors.surfaceSolid,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: "#31516D",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Salas",
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="admin/users"
        options={{
          title: "Administração",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="shield-checkmark" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
