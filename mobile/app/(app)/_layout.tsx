import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
      size={focused ? 24 : 22}
      color={focused ? "#2F6FAD" : "#667085"}
    />
  );
}

export default function AppLayout() {
  const { isAdmin } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#F7F8FA" },
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "800" },
        headerShadowVisible: false,
        tabBarActiveTintColor: "#2F6FAD",
        tabBarInactiveTintColor: "#667085",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
        tabBarItemStyle: { paddingTop: 5 },
        tabBarStyle: {
          height: 68,
          paddingTop: 4,
          backgroundColor: "rgba(251, 253, 255, 0.98)",
          borderTopColor: "#D6E0EA",
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
        name="profile/index"
        options={{
          title: "Perfil",
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
      <Tabs.Screen name="rooms/[id]/index" options={{ href: null, title: "Sala" }} />
      <Tabs.Screen name="rooms/create" options={{ href: null, title: "Nova sala" }} />
      <Tabs.Screen name="rooms/[id]/devices" options={{ href: null, title: "Dispositivos" }} />
      <Tabs.Screen name="rooms/[id]/devices/edit" options={{ href: null, title: "Dispositivo" }} />
      <Tabs.Screen
        name="rooms/[id]/collaborators"
        options={{ href: null, title: "Colaboradores" }}
      />
      <Tabs.Screen name="rooms/[id]/edit" options={{ href: null, title: "Editar sala" }} />
      <Tabs.Screen name="profile/edit" options={{ href: null, title: "Editar perfil" }} />
    </Tabs>
  );
}
