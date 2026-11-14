import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { colors, radius, spacing, type ColorName } from './theme';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, { bg: string; border: string; fg: ColorName; icon: IconName }> = {
  info: { bg: colors.primarySoft, border: '#B4E4EE', fg: 'primaryDark', icon: 'information-circle' },
  success: { bg: colors.successSoft, border: '#BFE6D2', fg: 'success', icon: 'checkmark-circle' },
  warning: { bg: colors.warningSoft, border: '#F2DCA6', fg: 'warning', icon: 'alert-circle' },
  danger: { bg: colors.dangerSoft, border: '#F5C6C1', fg: 'danger', icon: 'close-circle' },
};

interface Props {
  tone?: Tone;
  message: string;
  /** título opcional em destaque (Alert do shadcn/ui) */
  title?: string;
}

export function Banner({ tone = 'info', message, title }: Props) {
  const t = tones[tone];
  return (
    <View
      style={[styles.box, { backgroundColor: t.bg, borderColor: t.border }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon name={t.icon} size={20} color={t.fg} />
      <View style={styles.body}>
        {title ? (
          <AppText variant="label" color={t.fg}>
            {title}
          </AppText>
        ) : null}
        <AppText variant={title ? 'caption' : 'label'} color={t.fg} style={title ? { fontSize: 14, lineHeight: 20 } : undefined}>
          {message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  body: { flex: 1, gap: 2 },
});
