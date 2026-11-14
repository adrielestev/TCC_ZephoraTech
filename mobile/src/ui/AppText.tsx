import { Text, type TextProps } from 'react-native';
import { colors, type, type ColorName, type TextVariant } from './theme';

interface Props extends TextProps {
  variant?: TextVariant;
  color?: ColorName;
  center?: boolean;
}

export function AppText({ variant = 'body', color = 'text', center, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[{ color: colors[color] }, type[variant], center && { textAlign: 'center' }, style]}
    />
  );
}
