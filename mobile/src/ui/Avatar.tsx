import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors } from './theme';

interface Props {
  name: string;
  uri?: string | null;
  size?: number;
}

export function Avatar({ name, uri, size = 44 }: Props) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <View
      style={[styles.box, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityLabel={`Foto de ${name}`}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <AppText variant="bodyStrong" color="primaryDark" style={{ fontSize: size * 0.38 }}>
          {initials || '?'}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
