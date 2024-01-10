import { MenuLink } from '@/modules/layout/types/MenuLink';

const documentation: MenuLink = {
  id: 'documentation',
  label: 'Documentation',
  icon: 'ri-book-open-line',
  href: 'https://docs.crowd.dev',
  display: () => true,
  disable: () => false,
};

export default documentation;
