import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import type { RoomPhoto } from '@/core/types';
import { Icon } from '@/ui/Icon';
import { colors, radius, shadows, spacing } from '@/ui/theme';

/** Galeria da sala (até 3 fotos) com indicador de posição. */
export function PhotoCarousel({ photos }: { photos: RoomPhoto[] }) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const height = width ? Math.min(Math.round((width * 9) / 16), 300) : 180;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (photos.length === 0) {
    return (
      <View style={[styles.frame, styles.placeholder]} onLayout={onLayout}>
        <Icon name="image-outline" size={40} color="textMuted" />
      </View>
    );
  }

  return (
    <View style={styles.frame} onLayout={onLayout}>
      {width > 0 ? (
        <FlatList
          data={photos}
          keyExtractor={(photo) => String(photo.slot)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item, index: i }) => (
            <Image
              source={{ uri: item.url }}
              style={{ width, height }}
              contentFit="cover"
              accessibilityLabel={`Foto ${i + 1} de ${photos.length} da sala`}
            />
          )}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        />
      ) : null}
      {photos.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {photos.map((photo, i) => (
            <View key={photo.slot} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.lg, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: colors.primarySoft, boxShadow: shadows.card },
  placeholder: { height: 160, alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', bottom: spacing.sm, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { backgroundColor: colors.surface, width: 20 },
});
