import { Href, Link, Stack, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { colors, layout, typography } from "@/theme/tokens";
import { BackButton } from "@/components/BackButton";

const desktopBreakpoint = layout.desktopBreakpoint;

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
        style={({ pressed }) => ({
          minHeight: 48,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 14,
          borderRadius: 12,
          backgroundColor: active
            ? colors.primarySoft
            : pressed
              ? colors.surfaceMuted
              : "transparent",
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
          <Ionicons name="home" size={30} color={colors.primary} />
          <Text style={{ ...typography.section, color: colors.ink, letterSpacing: 1 }}>
            ZEPHORA
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          <Text
            style={{
              paddingHorizontal: 14,
              marginBottom: 4,
              color: colors.muted,
              ...typography.caption,
              fontWeight: "800",
              letterSpacing: 1.1,
              textTransform: "uppercase",
            }}
          >
            Menu principal
          </Text>
          <SidebarLink href="/" label="Salas" icon="home-outline" active={onRooms} />
          <SidebarLink
            href="/profile"
            label="Perfil"
            icon="person-outline"
            active={onProfile}
          />
          {isAdmin && (
            <SidebarLink
              href="/admin/users"
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
          style={({ pressed }) => ({
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: pressed ? colors.errorSoft : "transparent",
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

export default function AppLayout() {
  const { isAdmin } = useAuth();
  const { width } = useWindowDimensions();
  const showSidebar = Platform.OS === "web" && width >= desktopBreakpoint;

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: colors.surfaceMuted }}>
      {showSidebar && <WebSidebar isAdmin={isAdmin} />}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Stack
          screenOptions={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surfaceMuted },
            headerTintColor: colors.ink,
            headerTitleStyle: { fontWeight: "800" },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="rooms/[id]/index"
            options={{ title: "Sala", headerLeft: () => <BackButton destination="rooms" /> }}
          />
          <Stack.Screen
            name="rooms/create"
            options={{ title: "Nova sala", headerLeft: () => <BackButton destination="rooms" /> }}
          />
          <Stack.Screen
            name="rooms/[id]/devices/index"
            options={{ title: "Dispositivos", headerLeft: () => <BackButton destination="room" /> }}
          />
          <Stack.Screen
            name="rooms/[id]/devices/edit"
            options={{ title: "Dispositivo", headerLeft: () => <BackButton destination="devices" /> }}
          />
          <Stack.Screen
            name="rooms/[id]/automations"
            options={{ title: "Automações", headerLeft: () => <BackButton destination="room" /> }}
          />
          <Stack.Screen
            name="rooms/[id]/collaborators"
            options={{ title: "Colaboradores", headerLeft: () => <BackButton destination="room" /> }}
          />
          <Stack.Screen
            name="rooms/[id]/edit"
            options={{ title: "Editar sala", headerLeft: () => <BackButton destination="room" /> }}
          />
        </Stack>
      </View>
    </View>
  );
}
