import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing, type ColorName } from './theme';

const logoSource = require('../../assets/Logo_Zephora.png');
const RATIO = 1085 / 850;

export type BrandTone = 'ink' | 'primary' | 'chalk';
const tint: Record<BrandTone, ColorName> = { ink: 'text', primary: 'primary', chalk: 'chalk' };

interface Props {
  /** altura do pássaro */
  size?: number;
  /** ink: sobre fundo claro · chalk: sobre a lousa · primary: destaque azul */
  tone?: BrandTone;
}

/** Pássaro do Zephora (logo oficial), colorido pelo tom escolhido. */
export function BrandMark({ size = 40, tone = 'ink' }: Props) {
  return (
    <View style={styles.center} accessibilityLabel="Zephora">
      <Image
        source={logoSource}
        contentFit="contain"
        tintColor={colors[tint[tone]]}
        style={{ width: size * RATIO, height: size }}
      />
    </View>
  );
}

/** Pássaro + nome, para cabeçalhos de marca (login, menu lateral). */
export function BrandLockup({ size = 36, tone = 'ink' }: Props) {
  return (
    <View style={styles.lockup} accessibilityRole="header" accessibilityLabel="Zephora">
      <BrandMark size={size} tone={tone} />
      <AppText
        variant="display"
        color={tint[tone]}
        style={{
          fontSize: Math.round(size * 0.72),
          lineHeight: Math.round(size * 0.9),
          letterSpacing: -0.6,
        }}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        Zephora
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
