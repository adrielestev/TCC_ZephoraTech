// src/features/auth/components/AuthLayout.tsx -- Organiza o painel visual compartilhado pelas telas de autenticação.
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/ui/AppText';
import { BrandLockup } from '@/ui/BrandMark';
import { Card } from '@/ui/Card';
import { ChalkBoard } from '@/ui/ChalkBoard';
import { Icon, type IconName } from '@/ui/Icon';
import {
  CONTENT_WIDTHS,
  WIDE_BREAKPOINT,
  colors,
  motion,
  radius,
  shadows,
  spacing,
} from '@/ui/theme';

const gridPaper = require('../../../../assets/grid-paper.png');

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

/**
 * Estrutura comum das telas de acesso.
 * - telas largas (web/tablet): lousa azul à esquerda + formulário sobre papel quadriculado;
 * - celular: faixa de lousa no topo e o cartão do formulário sobreposto a ela.
 */
export function AuthLayout({ title, subtitle, children }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= WIDE_BREAKPOINT;

  const form = (
    <Animated.View
      entering={FadeInDown.delay(wide ? 0 : 80).duration(motion.slow)}
      style={styles.formWrap}
    >
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
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* a faixa do topo é escura: ícones da barra de status em branco */}
      {!wide ? <StatusBar style="light" /> : null}
      <View style={styles.root}>
        {wide ? (
          <ChalkBoard style={styles.panel} anchor="top" chalk={0.5} scrim>
            <View style={styles.panelInner}>
              <BrandLockup size={44} tone="chalk" />
              <Animated.View
                entering={FadeInLeft.delay(120).duration(motion.slow)}
                style={{ gap: spacing.xl }}
              >
                <AppText variant="display" color="chalk" style={styles.headline}>
                  Controle as salas da sua escola de qualquer lugar.
                </AppText>
                <View style={{ gap: spacing.md }}>
                  {highlights.map((h) => (
                    <View key={h.text} style={styles.highlight}>
                      <View style={styles.highlightIcon}>
                        <Icon name={h.icon} size={18} color="chalk" />
                      </View>
                      <AppText color="chalkMuted" style={{ flex: 1 }}>
                        {h.text}
                      </AppText>
                    </View>
                  ))}
                </View>
              </Animated.View>
            </View>
          </ChalkBoard>
        ) : null}

        <View style={styles.formSide}>
          {/* papel quadriculado translúcido atrás do formulário */}
          <Image
            source={gridPaper}
            contentFit="cover"
            style={[StyleSheet.absoluteFill, styles.grid]}
          />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={wide ? styles.contentWide : styles.contentNarrow}
            keyboardShouldPersistTaps="handled"
          >
            {!wide ? (
              <ChalkBoard
                style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}
                anchor="top"
                chalk={0.55}
              >
                <BrandLockup size={38} tone="chalk" />
                <AppText color="chalkMuted" style={styles.tagline}>
                  Sua escola, mais inteligente.
                </AppText>
              </ChalkBoard>
            ) : null}
            <View
              style={[
                styles.formArea,
                wide ? styles.formAreaWide : { paddingBottom: insets.bottom + spacing.xl },
              ]}
            >
              {form}
            </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  scroll: { flex: 1 },
  formSide: { flex: 1, backgroundColor: colors.bg },
  grid: { opacity: 0.9 },
  contentWide: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  contentNarrow: { flexGrow: 1 },

  // celular
  hero: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.sm,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderCurve: 'continuous',
  },
  tagline: { marginLeft: 2 },
  formArea: { alignItems: 'center', paddingHorizontal: spacing.lg, marginTop: -spacing.xxxl },
  formAreaWide: { marginTop: 0, paddingHorizontal: 0, width: '100%' },
  formWrap: { width: '100%', maxWidth: CONTENT_WIDTHS.form - 80, gap: spacing.xl },
  card: {
    padding: spacing.xl,
    gap: spacing.lg,
    borderRadius: radius.xl,
    boxShadow: shadows.raised,
  },

  // painel de lousa (telas largas)
  panel: { flex: 1, maxWidth: 580 },
  panelInner: { flex: 1, padding: spacing.xxxl, justifyContent: 'space-between' },
  headline: { fontSize: 36, lineHeight: 44, letterSpacing: -0.8 },
  highlight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  highlightIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.chalkVeil,
    borderWidth: 1,
    borderColor: colors.chalkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
