import type { IconName } from '@/ui/Icon';

export interface NavItem {
  /** nome da rota dentro de app/(app)/(tabs) */
  name: 'index' | 'admin' | 'profile';
  label: string;
  icon: IconName;
  activeIcon: IconName;
  adminOnly?: boolean;
}

/** Fluxo 2 do fluxograma: Salas e Perfil para todos; Administração só para admin. */
export const navItems: NavItem[] = [
  { name: 'index', label: 'Salas', icon: 'home-outline', activeIcon: 'home' },
  { name: 'admin', label: 'Administração', icon: 'settings-outline', activeIcon: 'settings', adminOnly: true },
  { name: 'profile', label: 'Perfil', icon: 'person-circle-outline', activeIcon: 'person-circle' },
];
