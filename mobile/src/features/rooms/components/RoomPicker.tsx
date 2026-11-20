import { StyleSheet, View } from 'react-native';
import type { Room } from '@/core/types';
import { AppText } from '@/ui/AppText';
import { Chip } from '@/ui/Selectors';
import { spacing } from '@/ui/theme';

interface Props {
  rooms: Room[];
  value: number | null;
  onChange: (roomId: number) => void;
}

/** Escolha de uma sala com chips (poucas salas = mais rápido que uma lista suspensa). */
export function RoomPicker({ rooms, value, onChange }: Props) {
  if (rooms.length === 0) {
    return <AppText color="textMuted">Nenhuma sala criada ainda. Crie uma sala primeiro.</AppText>;
  }
  return (
    <View style={styles.wrap}>
      {rooms.map((room) => (
        <Chip
          key={room.id}
          label={room.name}
          selected={room.id === value}
          onPress={() => onChange(room.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
