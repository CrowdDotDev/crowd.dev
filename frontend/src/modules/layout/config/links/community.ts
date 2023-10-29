import { MenuLink } from '@/modules/layout/types/MenuLink';

const community: MenuLink = {
  id: 'community',
  label: 'Community',
  icon: 'ri-discord-fill',
  href: 'https://crowd.dev/discord',
  display: () => true,
  disable: () => false,
};

export default community;
