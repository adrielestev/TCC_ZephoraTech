import type { Role, User } from '@/core/types';
import { Badge } from '@/ui/Badge';

const roleLabel: Record<Role, string> = {
  owner: 'Admin padrão',
  admin: 'Admin',
  member: 'Usuário comum',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge
      label={roleLabel[role]}
      tone={role === 'owner' ? 'owner' : role === 'admin' ? 'admin' : 'neutral'}
    />
  );
}

export function StatusBadges({ user }: { user: User }) {
  return (
    <>
      {!user.isActive ? <Badge label="Desativado" tone="danger" icon="ban-outline" /> : null}
      {!user.emailVerified ? <Badge label="E-mail não verificado" tone="warning" /> : null}
    </>
  );
}
