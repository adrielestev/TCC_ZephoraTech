import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import type { Room } from '@/core/types';
import { AppText } from '@/ui/AppText';
import { Badge } from '@/ui/Badge';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { colors, spacing } from '@/ui/theme';

export function RoomCard({ room, onPress }: { room: Room; onPress: () => void }) {
  const cover = room.photos[0]?.url;
  const devices = room.deviceCount === 1 ? '1 aparelho' : `${room.deviceCount} aparelhos`;

  return (
    <Card onPress={onPress} accessibilityLabel={`Abrir sala ${room.name}`} padded={false}>
      <View style={styles.cover}>
        {cover ? (
          <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <Icon name="school-outline" size={40} color="primary" />
        )}
      </View>
      <View style={styles.body}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="heading" numberOfLines={2}>
            {room.name}
          </AppText>
          {room.description ? (
            <AppText variant="caption" color="textMuted" numberOfLines={1}>
              {room.description}
            </AppText>
          ) : null}
        </View>
        <Badge label={devices} tone={room.deviceCount > 0 ? 'primary' : 'neutral'} icon="hardware-chip-outline" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cover: { height: 148, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
});
