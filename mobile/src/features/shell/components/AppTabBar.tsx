import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAuth } from '@/core/auth/AuthProvider';
import { RoleBadge } from '@/features/users/components';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { BrandMark } from '@/ui/BrandMark';
import { Icon } from '@/ui/Icon';
import { SIDEBAR_WIDTH, colors, radius, spacing } from '@/ui/theme';
import { navItems, type NavItem } from '../navItems';

interface Props extends BottomTabBarProps {
  /** web e tablets: menu lateral; celular: barra inferior */
  wide: boolean;
}

/** Navegação principal: troca de forma conforme a largura, mantendo as mesmas rotas. */
export function AppTabBar({ state, navigateToTab, insets, wide }: Props) {
  const { user, isAdmin } = useAuth();

  const entries = state.routes
    .map((route, index) => ({ route, index, item: navItems.find((n) => n.name === route.name) }))
    .filter((e): e is { route: typeof e.route; index: number; item: NavItem } => !!e.item && (!e.item.adminOnly || isAdmin));

  if (wide) {
    return (
      <View style={[styles.sidebar, { paddingTop: insets.top + spacing.lg }]} accessibilityRole="tablist">
        <View style={styles.brand}>
          <BrandMark />
        </View>
        <View style={styles.nav}>
          {entries.map(({ route, index, item }) => {
            const active = state.index === index;
            return (
              <Pressable
                key={route.key}
                onPress={() => navigateToTab(route.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
                style={({ pressed }) => [styles.sideItem, active && styles.sideItemActive, pressed && !active && styles.sidePressed]}
              >
                <Icon name={active ? item.activeIcon : item.icon} size={22} color={active ? 'primaryDark' : 'textMuted'} />
                <AppText variant="label" color={active ? 'primaryDark' : 'textMuted'}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        {user ? (
          <View style={[styles.user, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            <Avatar name={user.name} uri={user.avatarUrl} size={36} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="label" numberOfLines={1}>
                {user.name}
              </AppText>
              <RoleBadge role={user.role} />
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]} accessibilityRole="tablist">
      {entries.map(({ route, index, item }) => {
        const active = state.index === index;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigateToTab(route.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            style={styles.bottomItem}
          >
            <View style={[styles.pill, active && styles.pillActive]}>
              <Icon name={active ? item.activeIcon : item.icon} size={22} color={active ? 'primaryDark' : 'textMuted'} />
            </View>
            <AppText variant="caption" color={active ? 'primaryDark' : 'textMuted'} style={styles.bottomLabel}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // menu lateral
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  brand: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xl },
  nav: { flex: 1, gap: spacing.xs },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderCurve: 'continuous',
  },
  sideItemActive: { backgroundColor: colors.primarySoft },
  sidePressed: { backgroundColor: colors.surfaceMuted },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // barra inferior
  bottom: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  bottomItem: { flex: 1, alignItems: 'center', gap: 2, minHeight: 48 },
  pill: { width: 56, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: colors.primarySoft },
  bottomLabel: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
});
