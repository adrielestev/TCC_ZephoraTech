import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/ui/AppText';
import { BrandMark } from '@/ui/BrandMark';
import { Card } from '@/ui/Card';
import { Icon, type IconName } from '@/ui/Icon';
import { CONTENT_WIDTHS, WIDE_BREAKPOINT, colors, motion, radius, spacing } from '@/ui/theme';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const highlights: { icon: IconName; text: string }[] = [
  { icon: 'bulb-outline', text: 'Ligue e desligue os aparelhos de cada sala' },
  { icon: 'flash-outline', text: 'Automações que reagem a sensores de presença' },
  { icon: 'people-outline', text: 'Cada pessoa vê só as salas liberadas para ela' },
];

/** Estrutura comum das telas de acesso: painel de marca (telas largas) + cartão com o formulário. */
export function AuthLayout({ title, subtitle, children }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= WIDE_BREAKPOINT;

  const form = (
    <Animated.View entering={FadeInDown.duration(motion.base)} style={styles.formWrap}>
      {!wide ? (
        <View style={styles.mobileBrand}>
          <BrandMark size={44} />
        </View>
      ) : null}
      <Card style={styles.card}>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="display" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? <AppText color="textMuted">{subtitle}</AppText> : null}
        </View>
        {children}
      </Card>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.root}>
        {wide ? (
          <View style={styles.panel}>
            <View style={styles.circleA} />
            <View style={styles.circleB} />
            <BrandMark size={48} inverted />
            <View style={{ gap: spacing.lg }}>
              <AppText variant="display" color="onPrimary" style={styles.headline}>
                Controle as salas da sua escola de qualquer lugar.
              </AppText>
              <View style={{ gap: spacing.md }}>
                {highlights.map((h) => (
                  <View key={h.text} style={styles.highlight}>
                    <View style={styles.highlightIcon}>
                      <Icon name={h.icon} size={18} color="onPrimary" />
                    </View>
                    <AppText color="onPrimary" style={{ flex: 1, opacity: 0.92 }}>
                      {h.text}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          {form}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  formWrap: { width: '100%', maxWidth: CONTENT_WIDTHS.form - 80, gap: spacing.xl },
  mobileBrand: { alignItems: 'center' },
  card: { padding: spacing.xl, gap: spacing.lg, borderRadius: radius.xl },
  panel: {
    flex: 1,
    maxWidth: 560,
    backgroundColor: colors.primaryDark,
    padding: spacing.xxxl,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  headline: { fontSize: 34, lineHeight: 42 },
  highlight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  highlightIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleA: { position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.07)' },
  circleB: { position: 'absolute', bottom: -120, left: -60, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(255,255,255,0.05)' },
});
