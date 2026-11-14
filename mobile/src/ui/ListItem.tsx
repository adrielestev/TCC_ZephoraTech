import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { colors, radius, shadows, spacing, type ColorName } from './theme';

export type TileTone = 'primary' | 'neutral' | 'admin' | 'success' | 'danger';

const tileTones: Record<TileTone, { bg: string; fg: ColorName }> = {
  primary: { bg: colors.primarySoft, fg: 'primary' },
  neutral: { bg: colors.surfaceMuted, fg: 'textMuted' },
  admin: { bg: colors.adminSoft, fg: 'admin' },
  success: { bg: colors.successSoft, fg: 'success' },
  danger: { bg: colors.dangerSoft, fg: 'danger' },
};

/** Quadrado arredondado com ícone: identidade visual de aparelhos, módulos e atalhos. */
export function IconTile({
  name,
  tone = 'primary',
  size = 48,
  solid,
}: {
  name: IconName;
  tone?: TileTone;
  size?: number;
  /** preenchido com a cor forte (ex.: aparelho ligado) */
  solid?: boolean;
}) {
  const t = tileTones[tone];
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, backgroundColor: solid ? colors.primary : t.bg },
      ]}
    >
      <Icon name={name} size={Math.round(size * 0.5)} color={solid ? 'onPrimary' : t.fg} />
    </View>
  );
}

interface Props {
  title: string;
  description?: string;
  /** conteúdo à esquerda (IconTile, Avatar...) */
  leading?: ReactNode;
  /** conteúdo abaixo do texto (badges) */
  footer?: ReactNode;
  /** conteúdo à direita (Switch, Badge...). Sem `trailing` e com `onPress`, mostra a seta. */
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/** Linha de lista (Item do shadcn/ui): leading + texto + trailing, dentro de um card. */
export function ListItem({ title, description, leading, footer, trailing, onPress, accessibilityLabel }: Props) {
  const content = (
    <>
      {leading}
      <View style={styles.text}>
        <AppText variant="bodyStrong">{title}</AppText>
        {description ? (
          <AppText variant="caption" color="textMuted">
            {description}
          </AppText>
        ) : null}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
      {trailing ?? (onPress ? <Icon name="chevron-forward" size={20} color="textMuted" /> : null)}
    </>
  );

  if (!onPress) return <View style={styles.item}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.surfaceMuted }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadows.card,
  },
  tile: { borderRadius: radius.md, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
});
