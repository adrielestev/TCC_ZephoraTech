import { useEffect } from 'react';
import {
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from './theme';

interface Props {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
}

/** Placeholder pulsante (Skeleton do shadcn/ui) enquanto os dados chegam. */
export function Skeleton({ width = '100%', height = 16, rounded = radius.sm, style }: Props) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.45, { duration: 800 }), -1, true);
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: rounded, backgroundColor: colors.border },
        animated,
        style,
      ]}
    />
  );
}

/** Esqueleto de um card de sala. */
export function RoomCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={140} rounded={0} />
      <View style={styles.body}>
        <Skeleton width="55%" height={20} />
        <Skeleton width="35%" height={14} />
      </View>
    </View>
  );
}

/** Esqueleto de uma linha de lista (aparelho, usuário, módulo). */
export function ListItemSkeleton() {
  return (
    <View style={[styles.card, styles.row]}>
      <Skeleton width={48} height={48} rounded={radius.md} />
      <View style={{ flex: 1, gap: spacing.sm }}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonList({
  count = 3,
  children,
}: {
  count?: number;
  children: () => React.ReactNode;
}) {
  return (
    <View
      style={{ gap: spacing.md }}
      accessibilityLabel="Carregando"
      accessibilityLiveRegion="polite"
    >
      {Array.from({ length: count }, (_, i) => (
        <View key={i}>{children()}</View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  body: { padding: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
});
