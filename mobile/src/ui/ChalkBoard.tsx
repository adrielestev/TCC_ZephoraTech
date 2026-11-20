import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { gradients } from './theme';

const doodles = require('../../assets/chalk-doodles.png');

interface Props {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** parte da lousa que aparece quando o espaço é mais largo que alto */
  anchor?: 'top' | 'center' | 'bottom';
  /** intensidade dos rabiscos de giz (0 a 1) */
  chalk?: number;
  /** escurece a metade de baixo para dar leitura a textos sobre os rabiscos */
  scrim?: boolean;
}

/** Superfície "lousa azul": degradê escuro com rabiscos de giz (livros, fórmulas, lâmpada) por cima. */
export function ChalkBoard({ children, style, anchor = 'top', chalk = 0.5, scrim }: Props) {
  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={gradients.board}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Image
          source={doodles}
          contentFit="cover"
          contentPosition={anchor}
          style={[StyleSheet.absoluteFill, { opacity: chalk }]}
        />
      </View>
      {scrim ? (
        <LinearGradient
          colors={['rgba(11, 27, 63, 0)', 'rgba(11, 27, 63, 0.94)']}
          locations={[0, 0.55]}
          pointerEvents="none"
          style={styles.scrim}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
});
