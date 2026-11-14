import type { Esp32Status } from '@/core/types';
import { Badge } from '@/ui/Badge';
import type { TileTone } from '@/ui/ListItem';

export function Esp32StatusBadge({ status }: { status: Esp32Status }) {
  if (status === 'online') return <Badge label="Online" tone="success" icon="wifi" />;
  if (status === 'pending') return <Badge label="Aguardando conexão" tone="primary" icon="time-outline" />;
  return <Badge label="Offline" tone="warning" icon="cloud-offline-outline" />;
}

/** Cor do ícone do módulo conforme o status. */
export const esp32Tone: Record<Esp32Status, TileTone> = { online: 'success', pending: 'primary', offline: 'neutral' };
