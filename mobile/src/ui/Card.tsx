// src/ui/Card.tsx -- Cria um contêiner de conteúdo com superfícies e estados visuais padronizados.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, shadows, spacing } from './theme';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** false remove o espaçamento interno (ex.: card com foto até a borda) */
  padded?: boolean;
  /** destaca o card em azul (ex.: aparelho ligado) */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Card do shadcn/ui: superfície, borda sutil e sombra leve. Componha com CardHeader, CardContent... */
export function Card({
  children,
  onPress,
  accessibilityLabel,
  padded = true,
  active,
  style,
}: Props) {
  const base = [styles.card, padded && styles.padded, active && styles.active, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="heading">{title}</AppText>
        {description ? (
          <AppText variant="caption" color="textMuted">
            {description}
          </AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function CardContent({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.content, style]}>{children}</View>;
}

export function CardFooter({ children }: { children: ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadows.card,
    overflow: 'hidden',
  },
  padded: { padding: spacing.lg, gap: spacing.md },
  active: { backgroundColor: colors.surfaceActive, borderColor: colors.primary + '55' },
  pressed: { backgroundColor: colors.surfaceMuted },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  content: { gap: spacing.md },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
