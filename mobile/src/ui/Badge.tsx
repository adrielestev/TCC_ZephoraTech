import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { colors, fonts, radius, spacing, type ColorName } from './theme';

export type BadgeTone =
  'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'admin' | 'owner';

const tones: Record<BadgeTone, { bg: string; fg: ColorName }> = {
  neutral: { bg: colors.surfaceMuted, fg: 'textMuted' },
  primary: { bg: colors.primarySoft, fg: 'primaryDark' },
  success: { bg: colors.successSoft, fg: 'success' },
  warning: { bg: colors.warningSoft, fg: 'warning' },
  danger: { bg: colors.dangerSoft, fg: 'danger' },
  admin: { bg: colors.adminSoft, fg: 'admin' },
  owner: { bg: colors.ownerSoft, fg: 'owner' },
};

interface Props {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
}

export function Badge({ label, tone = 'neutral', icon }: Props) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {icon ? <Icon name={icon} size={13} color={t.fg} /> : null}
      <AppText variant="caption" color={t.fg} style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  text: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
});
