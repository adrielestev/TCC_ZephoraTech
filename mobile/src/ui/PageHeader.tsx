// src/ui/PageHeader.tsx -- Padroniza o título, a descrição e a ação principal do cabeçalho de uma tela.
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { spacing } from './theme';

interface Props {
  title: string;
  description?: string;
  /** texto pequeno acima do título */
  eyebrow?: string;
  /** botão ou menu à direita */
  action?: ReactNode;
}

/** Cabeçalho das telas principais (abas), no lugar do título repetido do navegador. */
export function PageHeader({ title, description, eyebrow, action }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        {eyebrow ? (
          <AppText variant="overline" color="primary">
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="display" accessibilityRole="header">
          {title}
        </AppText>
        {description ? <AppText color="textMuted">{description}</AppText> : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  text: { flex: 1, gap: spacing.xs },
});
