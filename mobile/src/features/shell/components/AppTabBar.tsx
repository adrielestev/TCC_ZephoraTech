// src/features/shell/components/AppTabBar.tsx -- Renderiza a navegação principal como barra inferior ou menu lateral adaptável.
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAuth } from '@/core/auth/AuthProvider';
import { RoleBadge } from '@/features/users/components';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { BrandLockup } from '@/ui/BrandMark';
import { ChalkBoard } from '@/ui/ChalkBoard';
import { Icon } from '@/ui/Icon';
import { SIDEBAR_WIDTH, colors, fonts, radius, spacing } from '@/ui/theme';
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
    .filter(
      (e): e is { route: typeof e.route; index: number; item: NavItem } =>
        !!e.item && (!e.item.adminOnly || isAdmin),
    );

  if (wide) {
    // menu lateral na lousa azul, com rabiscos discretos no rodapé
    return (
      <ChalkBoard style={styles.sidebar} anchor="bottom" chalk={0.22}>
        <View
          style={[styles.sidebarInner, { paddingTop: insets.top + spacing.xl }]}
          accessibilityRole="tablist"
        >
          <View style={styles.brand}>
            <BrandLockup size={32} tone="chalk" />
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
                  style={({ pressed }) => [
                    styles.sideItem,
                    active && styles.sideItemActive,
                    pressed && !active && styles.sidePressed,
                  ]}
                >
                  <View style={[styles.indicator, active && styles.indicatorOn]} />
                  <Icon
                    name={active ? item.activeIcon : item.icon}
                    size={22}
                    color={active ? 'chalk' : 'chalkMuted'}
                  />
                  <AppText variant="label" color={active ? 'chalk' : 'chalkMuted'}>
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {user ? (
            <View style={[styles.user, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
              <Avatar name={user.name} uri={user.avatarUrl} size={38} />
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="label" color="chalk" numberOfLines={1}>
                  {user.name}
                </AppText>
                <RoleBadge role={user.role} />
              </View>
            </View>
          ) : null}
        </View>
      </ChalkBoard>
    );
  }

  return (
    <View
      style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}
      accessibilityRole="tablist"
    >
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
              <Icon
                name={active ? item.activeIcon : item.icon}
                size={22}
                color={active ? 'primary' : 'textMuted'}
              />
            </View>
            <AppText
              variant="caption"
              color={active ? 'primaryDark' : 'textMuted'}
              style={[styles.bottomLabel, active && { fontFamily: fonts.bold }]}
            >
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
  sidebar: { width: SIDEBAR_WIDTH },
  sidebarInner: { flex: 1, paddingHorizontal: spacing.md },
  brand: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xxl },
  nav: { flex: 1, gap: spacing.xs },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 46,
    paddingRight: spacing.md,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  sideItemActive: { backgroundColor: colors.chalkVeil },
  sidePressed: { backgroundColor: 'rgba(234, 241, 255, 0.06)' },
  // barrinha azul-clara à esquerda do item ativo
  indicator: {
    width: 4,
    alignSelf: 'stretch',
    marginVertical: 10,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  indicatorOn: { backgroundColor: colors.sky },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.chalkLine,
  },

  // barra inferior
  bottom: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    boxShadow: '0 -6px 18px rgba(11, 27, 63, 0.06)',
  },
  bottomItem: { flex: 1, alignItems: 'center', gap: 2, minHeight: 48 },
  pill: {
    width: 60,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: colors.primarySoft },
  bottomLabel: { fontSize: 12, lineHeight: 16, fontFamily: fonts.semibold },
});
