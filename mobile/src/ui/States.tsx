import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getErrorMessage } from '@/core/api/errors';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { colors, radius, spacing } from './theme';

export function LoadingView({ label = 'Carregando...' }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText color="textMuted">{label}</AppText>
    </View>
  );
}

interface EmptyProps {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'danger' | 'success';
}

const iconTones = {
  neutral: { bg: colors.primarySoft, fg: 'primary' },
  danger: { bg: colors.dangerSoft, fg: 'danger' },
  success: { bg: colors.successSoft, fg: 'success' },
} as const;

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
  tone = 'neutral',
}: EmptyProps) {
  const t = iconTones[tone];
  return (
    <View style={styles.center}>
      <View style={[styles.iconCircle, { backgroundColor: t.bg }]}>
        <Icon name={icon} size={32} color={t.fg} />
      </View>
      <View style={styles.textBlock}>
        <AppText variant="heading" center>
          {title}
        </AppText>
        {message ? (
          <AppText color="textMuted" center>
            {message}
          </AppText>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          fullWidth={false}
          style={{ alignSelf: 'center' }}
        />
      ) : null}
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      tone="danger"
      title="Não foi possível carregar"
      message={getErrorMessage(error)}
      actionLabel={onRetry ? 'Tentar de novo' : undefined}
      onAction={onRetry}
    />
  );
}

interface QueryLike<T> {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: T | undefined;
  refetch: () => unknown;
}

interface BoundaryProps<T> {
  query: QueryLike<T>;
  children: (data: T) => ReactNode;
  /** placeholder enquanto carrega (ex.: <SkeletonList />). Padrão: indicador de carregamento. */
  skeleton?: ReactNode;
}

/** Cuida dos estados de carregamento e erro de uma consulta (comum ou infinita). */
export function QueryBoundary<T>({ query, children, skeleton }: BoundaryProps<T>) {
  if (query.isPending) return <>{skeleton ?? <LoadingView />}</>;
  if (query.isError || query.data === undefined) {
    return <ErrorView error={query.error} onRetry={() => void query.refetch()} />;
  }
  return <>{children(query.data)}</>;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  textBlock: { gap: spacing.xs, maxWidth: 360 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
