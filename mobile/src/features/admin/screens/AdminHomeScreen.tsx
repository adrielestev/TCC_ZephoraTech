// src/features/admin/screens/AdminHomeScreen.tsx -- Apresenta os atalhos de administração disponíveis conforme as permissões do usuário.
import { useRouter, type Href } from 'expo-router';
import { routes } from '@/core/navigation/routes';
import { type IconName } from '@/ui/Icon';
import { IconTile, ListItem } from '@/ui/ListItem';
import { PageHeader } from '@/ui/PageHeader';
import { Screen } from '@/ui/Screen';

interface MenuItem {
  icon: IconName;
  title: string;
  description: string;
  href: Href;
}

const items: MenuItem[] = [
  {
    icon: 'people-outline',
    title: 'Usuários',
    description: 'Liberar salas, promover a admin e ativar ou desativar contas.',
    href: routes.users,
  },
  {
    icon: 'hardware-chip-outline',
    title: 'Módulos ESP32',
    description: 'Ver o status dos módulos e cadastrar novos aparelhos.',
    href: routes.esp32List,
  },
  {
    icon: 'add-circle-outline',
    title: 'Nova sala',
    description: 'Criar uma sala para organizar os aparelhos.',
    href: routes.newRoom,
  },
];

export default function AdminHomeScreen() {
  const router = useRouter();
  return (
    <Screen>
      <PageHeader
        eyebrow="Painel"
        title="Administração"
        description="Tudo o que você precisa para configurar a escola."
      />
      {items.map((item) => (
        <ListItem
          key={item.title}
          leading={<IconTile name={item.icon} tone="primary" size={52} />}
          title={item.title}
          description={item.description}
          onPress={() => router.push(item.href)}
        />
      ))}
    </Screen>
  );
}
