// src/ui/TextField.tsx -- Padroniza entradas de texto e encaminha a referência ao campo nativo.
import { forwardRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { colors, fontSize, fonts, radius, spacing } from './theme';

/** Tipo da referência de um TextInput (para chamar .focus()). */
export type TextInputHandle = ComponentRef<typeof TextInput>;

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  /** ícone à esquerda do campo */
  icon?: IconName;
}

export const TextField = forwardRef<TextInputHandle, Props>(function TextField(
  { label, error, hint, icon, secureTextEntry, multiline, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.wrapper}>
      <AppText variant="label">{label}</AppText>
      <View
        style={[
          styles.field,
          focused && styles.focused,
          !!error && styles.errored,
          !!error && focused && { boxShadow: `0 0 0 3px ${colors.ringDanger}` },
          multiline && { alignItems: 'flex-start' },
        ]}
      >
        {icon ? (
          <View style={multiline ? { paddingTop: spacing.md } : undefined}>
            <Icon name={icon} size={20} color="textMuted" />
          </View>
        ) : null}
        <TextInput
          ref={ref}
          {...rest}
          multiline={multiline}
          secureTextEntry={isPassword && hidden}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, multiline && styles.multiline]}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            hitSlop={8}
          >
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} color="textMuted" />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color="textMuted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 50,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
  },
  focused: { borderColor: colors.primary, boxShadow: `0 0 0 3px ${colors.ring}` },
  errored: { borderColor: colors.danger },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    color: colors.text,
    paddingVertical: spacing.md,
    // remove o contorno padrão do navegador (o anel de foco é desenhado pelo campo)
    ...({ outlineStyle: 'none' } as object),
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
});
