import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { colors, fonts, radius, spacing } from './theme';

interface Props {
  steps: string[];
  /** passo atual, começando em 0 (use steps.length para "tudo concluído") */
  current: number;
  /** título exibido quando todos os passos foram concluídos */
  doneLabel?: string;
}

/** Indicador de passos de assistentes (ex.: cadastro de ESP32, nova automação). */
export function StepIndicator({ steps, current, doneLabel = 'Concluído' }: Props) {
  const finished = current >= steps.length;
  const label = finished ? doneLabel : steps[current];
  return (
    <View
      accessibilityLabel={
        finished
          ? 'Todos os passos concluídos'
          : `Passo ${current + 1} de ${steps.length}: ${label}`
      }
      style={styles.wrap}
    >
      <View style={styles.track}>
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <View key={step} style={styles.stepWrap}>
              <View
                style={[styles.dot, (done || active) && styles.dotOn, active && styles.dotActive]}
              >
                {done ? (
                  <Icon name="checkmark" size={14} color="onPrimary" />
                ) : (
                  <AppText
                    variant="caption"
                    color={active ? 'onPrimary' : 'textMuted'}
                    style={styles.dotText}
                  >
                    {index + 1}
                  </AppText>
                )}
              </View>
              {index < steps.length - 1 ? (
                <View style={[styles.line, done && styles.lineOn]} />
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={{ gap: 2 }}>
        {!finished ? (
          <AppText variant="caption" color="textMuted">
            Passo {current + 1} de {steps.length}
          </AppText>
        ) : null}
        <AppText variant="title">{label}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  track: { flexDirection: 'row', alignItems: 'center' },
  stepWrap: { flexDirection: 'row', alignItems: 'center', flexGrow: 1, flexBasis: 0 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotActive: { boxShadow: `0 0 0 4px ${colors.ring}` },
  dotText: { fontFamily: fonts.bold, lineHeight: 16 },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  lineOn: { backgroundColor: colors.primary },
});
