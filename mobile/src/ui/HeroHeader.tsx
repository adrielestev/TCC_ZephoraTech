// src/ui/HeroHeader.tsx -- Apresenta o cabeçalho principal de uma tela com resumo e indicadores.
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from './AppText';
import { ChalkBoard } from './ChalkBoard';
import { Icon, type IconName } from './Icon';
import { colors, motion, radius, shadows, spacing } from './theme';

export interface HeroStat {
  icon: IconName;
  value: number;
  /** já no singular/plural correto (ex.: "3 salas") */
  label: string;
}

interface Props {
  title: string;
  /** texto pequeno acima do título (ex.: saudação) */
  eyebrow?: string;
  description?: string;
  /** botão à direita (use variant="light") */
  action?: ReactNode;
  /** números-resumo exibidos como "giz" embaixo */
  stats?: HeroStat[];
}

/** Cabeçalho de destaque sobre a lousa azul. Telas principais com resumo (ex.: Salas). */
export function HeroHeader({ title, eyebrow, description, action, stats }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(motion.base)}>
      <ChalkBoard style={styles.board} anchor="top" chalk={0.4}>
        <View style={styles.row}>
          <View style={styles.text}>
            {eyebrow ? (
              <AppText variant="overline" color="chalkMuted">
                {eyebrow}
              </AppText>
            ) : null}
            <AppText variant="display" color="chalk" accessibilityRole="header">
              {title}
            </AppText>
            {description ? <AppText color="chalkMuted">{description}</AppText> : null}
          </View>
          {action}
        </View>
        {stats && stats.length > 0 ? (
          <View style={styles.stats}>
            {stats.map((s) => (
              <View key={s.label} style={styles.stat} accessibilityLabel={s.label}>
                <Icon name={s.icon} size={16} color="sky" />
                <AppText variant="label" color="chalk">
                  {s.label}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </ChalkBoard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    padding: spacing.xl,
    gap: spacing.lg,
    boxShadow: shadows.raised,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  text: { flex: 1, gap: spacing.xs },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.chalkVeil,
    borderWidth: 1,
    borderColor: colors.chalkLine,
  },
});
