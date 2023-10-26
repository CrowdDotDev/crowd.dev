import { MenuLink } from '@/modules/layout/types/MenuLink';

const contactUs: MenuLink = {
  id: 'contactUs',
  label: 'Contact us',
  icon: 'ri-mail-line',
  href: 'mailto:help@crowd.dev',
  display: () => true,
  disable: () => false,
};

export default contactUs;
