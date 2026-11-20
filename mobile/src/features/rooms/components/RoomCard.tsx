import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import type { Room } from '@/core/types';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { ChalkBoard } from '@/ui/ChalkBoard';
import { Icon } from '@/ui/Icon';
import { colors, radius, spacing } from '@/ui/theme';

const anchors = ['top', 'center', 'bottom'] as const;

export function RoomCard({ room, onPress }: { room: Room; onPress: () => void }) {
  const cover = room.photos[0]?.url;
  const devices = room.deviceCount === 1 ? '1 aparelho' : `${room.deviceCount} aparelhos`;

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`Abrir sala ${room.name}, ${devices}`}
      padded={false}
    >
      <View style={styles.cover}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
          />
        ) : (
          // sala sem foto: lousa com rabiscos, no lugar de um bloco vazio
          <ChalkBoard
            style={StyleSheet.absoluteFill}
            anchor={anchors[room.id % anchors.length]}
            chalk={0.6}
          >
            <View style={styles.placeholder}>
              <Icon name="school-outline" size={36} color="chalk" />
            </View>
          </ChalkBoard>
        )}
        <View style={[styles.chip, room.deviceCount === 0 && styles.chipEmpty]}>
          <Icon
            name="hardware-chip-outline"
            size={14}
            color={room.deviceCount > 0 ? 'primaryDark' : 'textMuted'}
          />
          <AppText variant="label" color={room.deviceCount > 0 ? 'primaryDark' : 'textMuted'}>
            {devices}
          </AppText>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.info}>
          <AppText variant="heading" numberOfLines={2}>
            {room.name}
          </AppText>
          {room.description ? (
            <AppText variant="caption" color="textMuted" numberOfLines={1}>
              {room.description}
            </AppText>
          ) : null}
        </View>
        <View style={styles.go}>
          <Icon name="arrow-forward" size={18} color="primaryDark" />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cover: { height: 148, backgroundColor: colors.ink, overflow: 'hidden' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chip: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  chipEmpty: { backgroundColor: 'rgba(255,255,255,0.8)' },
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  info: { flex: 1, gap: 2 },
  go: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
