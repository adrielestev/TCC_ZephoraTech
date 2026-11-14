import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { colors } from './theme';

const logoSource = require('../../assets/Logo_Zephora.png');

/** Logo oficial do Zephora. */
export function BrandMark({ size = 40, inverted }: { size?: number; inverted?: boolean }) {
  return (
    <View style={styles.row} accessibilityLabel="Zephora">
      <Image
        source={logoSource}
        contentFit="contain"
        style={[
          styles.logo,
          { width: size * (1085 / 850), height: size },
          inverted && { tintColor: colors.surface },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', justifyContent: 'center' },
  logo: { tintColor: colors.text },
});
