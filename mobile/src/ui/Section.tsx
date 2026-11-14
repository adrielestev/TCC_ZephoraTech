import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { spacing } from './theme';

interface Props {
  title: string;
  description?: string;
  /** contador exibido ao lado do título */
  count?: number;
  action?: ReactNode;
  children: ReactNode;
}

export function Section({ title, description, count, action, children }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.titleRow}>
            <AppText variant="heading" accessibilityRole="header">
              {title}
            </AppText>
            {count !== undefined ? (
              <AppText variant="label" color="textMuted">
                {count}
              </AppText>
            ) : null}
          </View>
          {description ? (
            <AppText variant="caption" color="textMuted">
              {description}
            </AppText>
          ) : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
});
