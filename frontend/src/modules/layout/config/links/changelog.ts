import { MenuLink } from '@/modules/layout/types/MenuLink';

const changelog: MenuLink = {
  id: 'changelog',
  label: 'Changelog',
  icon: 'ri-megaphone-line',
  href: 'https://changelog.crowd.dev',
  display: () => true,
  disable: () => false,
};

export default changelog;
