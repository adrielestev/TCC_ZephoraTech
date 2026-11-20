import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, type ColorName } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorName;
}

export function Icon({ name, size = 22, color = 'text' }: IconProps) {
  return <Ionicons name={name} size={size} color={colors[color]} />;
}

interface IconButtonProps extends IconProps {
  label: string;
  onPress: () => void;
}

/** Botão só com ícone; `label` é obrigatório para acessibilidade. */
export function IconButton({ name, size = 22, color = 'text', label, onPress }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && { backgroundColor: colors.surfaceMuted },
      ]}
    >
      <Ionicons name={name} size={size} color={colors[color]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    minWidth: 40,
    minHeight: 40,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
