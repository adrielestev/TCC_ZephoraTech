// src/ui/Screen.tsx -- Define a estrutura e a largura de conteúdo compartilhadas pelas telas do app.
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CONTENT_WIDTHS,
  WIDE_BREAKPOINT,
  colors,
  shadows,
  spacing,
  type ContentWidth,
} from './theme';

interface Props {
  children: ReactNode;
  /** puxar para atualizar */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** centraliza verticalmente (telas de login) */
  centered?: boolean;
  /** conteúdo fixo no rodapé (ex.: botão de salvar) */
  footer?: ReactNode;
  /** largura máxima do conteúdo: form (560), content (720, padrão) ou wide (1040) */
  width?: ContentWidth;
  /** sem rolagem própria: o filho é o scroll (ex.: FlatList) */
  scroll?: boolean;
}

/** Base de toda tela: rolagem, teclado, largura máxima centralizada, margens seguras e espaçamento padrão. */
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  centered,
  footer,
  width = 'content',
  scroll = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const pad = windowWidth >= WIDE_BREAKPOINT ? spacing.xl : spacing.lg;
  const inner = [styles.inner, { maxWidth: CONTENT_WIDTHS[width] }];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { padding: pad }, centered && styles.centered]}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          <View style={inner}>{children}</View>
        </ScrollView>
      ) : (
        <View style={styles.flex}>{children}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={inner}>{footer}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingBottom: spacing.xxl },
  centered: { justifyContent: 'center' },
  inner: { width: '100%', alignSelf: 'center', gap: spacing.lg },
  footer: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    boxShadow: shadows.card,
  },
});
