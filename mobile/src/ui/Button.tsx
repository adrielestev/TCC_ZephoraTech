// src/ui/Button.tsx -- Fornece botões reutilizáveis com variantes visuais e estados de carregamento.
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { colors, radius, shadows, spacing, type ColorName } from './theme';

/** `light` e `outlineLight` são para uso sobre a lousa (fundos escuros). */
export type ButtonVariant =
  'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'light' | 'outlineLight';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** ocupa toda a largura disponível (padrão) */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Variantes inspiradas no Button do shadcn/ui: default, secondary, outline, ghost e destructive. */
const palette: Record<
  ButtonVariant,
  { bg: string; border: string; text: ColorName; ring: string }
> = {
  primary: { bg: colors.primary, border: colors.primary, text: 'onPrimary', ring: colors.ring },
  secondary: {
    bg: colors.primarySoft,
    border: colors.primarySoft,
    text: 'primaryDark',
    ring: colors.ring,
  },
  outline: { bg: colors.surface, border: colors.borderStrong, text: 'text', ring: colors.ring },
  ghost: { bg: 'transparent', border: 'transparent', text: 'primary', ring: colors.ring },
  danger: { bg: colors.danger, border: colors.danger, text: 'onPrimary', ring: colors.ringDanger },
  light: {
    bg: colors.surface,
    border: colors.surface,
    text: 'primaryDark',
    ring: colors.chalkLine,
  },
  outlineLight: {
    bg: 'transparent',
    border: colors.chalkLine,
    text: 'chalk',
    ring: colors.chalkLine,
  },
};

const sizes: Record<ButtonSize, { minHeight: number; paddingHorizontal: number; icon: number }> = {
  sm: { minHeight: 36, paddingHorizontal: spacing.md, icon: 16 },
  md: { minHeight: 48, paddingHorizontal: spacing.lg, icon: 20 },
  lg: { minHeight: 54, paddingHorizontal: spacing.xl, icon: 22 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  fullWidth = true,
  style,
}: Props) {
  const [focused, setFocused] = useState(false);
  const p = palette[variant];
  const s = sizes[size];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: p.bg,
          borderColor: p.border,
          minHeight: s.minHeight,
          paddingHorizontal: s.paddingHorizontal,
        },
        fullWidth ? styles.full : styles.auto,
        variant === 'primary' && !inactive && { boxShadow: shadows.glow },
        focused && { boxShadow: `0 0 0 3px ${p.ring}` },
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
        pressed && !inactive && variant === 'ghost' && { backgroundColor: colors.primarySoft },
        pressed && !inactive && variant === 'outlineLight' && { backgroundColor: colors.chalkVeil },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors[p.text]} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={s.icon} color={p.text} /> : null}
          <AppText variant={size === 'sm' ? 'label' : 'bodyStrong'} color={p.text}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md + 2,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch' },
  auto: { alignSelf: 'flex-start' },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
