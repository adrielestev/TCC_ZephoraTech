import { Href, Link, Tabs, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/tokens";

const desktopBreakpoint = 960;

function SidebarLink({
  href,
  label,
  icon,
  active,
}: {
  href: Href;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityState={{ selected: active }}
        style={({ hovered, pressed }) => ({
          minHeight: 48,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 14,
          borderRadius: 12,
          backgroundColor: active ? "#E8F2FB" : hovered || pressed ? "#F3F7FA" : "transparent",
        })}
      >
        <Ionicons name={icon} size={20} color={active ? colors.primary : colors.muted} />
        <Text
          style={{
            color: active ? colors.primary : colors.text,
            fontWeight: active ? "800" : "600",
            fontSize: 14,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

function WebSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const onRooms = pathname === "/" || pathname.startsWith("/rooms");
  const onProfile = pathname.startsWith("/profile");
  const onAdmin = pathname.startsWith("/admin");

  return (
    <View
      accessibilityLabel="Navegação principal"
      style={{
        width: 264,
        flexShrink: 0,
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 20,
        backgroundColor: "#FFFFFF",
        borderRightWidth: 1,
        borderRightColor: colors.border,
        justifyContent: "space-between",
      }}
    >
      <View style={{ gap: 36 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 8 }}>
          <Image
            source={require("../../assets/images/Logo-zephora.svg")}
            contentFit="contain"
            style={{ width: 38, height: 34 }}
          />
          <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "900", letterSpacing: 1 }}>
            ZEPHORA
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          <Text
            style={{
              paddingHorizontal: 14,
              marginBottom: 4,
              color: colors.muted,
              fontSize: 11,
              fontWeight: "800",
              letterSpacing: 1.1,
              textTransform: "uppercase",
            }}
          >
            Menu principal
          </Text>
          <SidebarLink href="/(app)" label="Salas" icon="home-outline" active={onRooms} />
          <SidebarLink
            href="/(app)/profile"
            label="Perfil"
            icon="person-outline"
            active={onProfile}
          />
          {isAdmin && (
            <SidebarLink
              href="/(app)/admin/users"
              label="Administração"
              icon="shield-checkmark-outline"
              active={onAdmin}
            />
          )}
        </View>
      </View>

      <View style={{ gap: 14, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 18 }}>
        <View style={{ paddingHorizontal: 10, gap: 3 }}>
          <Text numberOfLines={1} style={{ color: colors.ink, fontWeight: "800", fontSize: 14 }}>
            {user?.name ?? "Usuário"}
          </Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12 }}>
            {user?.email}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => void signOut()}
          style={({ hovered, pressed }) => ({
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: hovered || pressed ? "#FFF3F1" : "transparent",
          })}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={{ color: colors.error, fontWeight: "700", fontSize: 14 }}>
            Sair da conta
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

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
  const { width } = useWindowDimensions();
  const showSidebar = Platform.OS === "web" && width >= desktopBreakpoint;

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: "#F7F8FA" }}>
      {showSidebar && <WebSidebar isAdmin={isAdmin} />}
      <View style={{ flex: 1, minWidth: 0 }}>
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
              display: showSidebar ? "none" : "flex",
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
          <Tabs.Screen
            name="rooms/[id]/devices/edit"
            options={{ href: null, title: "Dispositivo" }}
          />
          <Tabs.Screen
            name="rooms/[id]/collaborators"
            options={{ href: null, title: "Colaboradores" }}
          />
          <Tabs.Screen name="rooms/[id]/edit" options={{ href: null, title: "Editar sala" }} />
          <Tabs.Screen name="profile/edit" options={{ href: null, title: "Editar perfil" }} />
        </Tabs>
      </View>
    </View>
  );
}
