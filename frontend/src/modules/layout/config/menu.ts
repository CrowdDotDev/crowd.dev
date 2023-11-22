import { MenuLink } from '@/modules/layout/types/MenuLink';
import home from './links/home';
import contacts from './links/contacts';
import organizations from './links/organizations';
import activities from './links/activities';
import reports from './links/reports';
import eagleEye from './links/eagle-eye';
import automations from './links/automations';
import integrations from './links/integrations';
import shareFeedback from './links/share-feedback';
import documentation from './links/documentation';
import changelog from './links/changelog';
import community from './links/community';
import usersPermissions from './links/users-permissions';
import apiKeys from './links/api-keys';
import plansBilling from './links/plans-billing';

export const mainMenu: MenuLink[] = [
  home,
  contacts,
  organizations,
  activities,
  reports,
  eagleEye,
];

// Bottom menu
export const bottomMenu: MenuLink[] = [
  automations,
  integrations,
];

// Support menu
export const supportMenu: MenuLink[] = [
  shareFeedback,
  documentation,
  changelog,
  community,
];

// Tenant menu
export const tenantMenu: MenuLink[] = [
  usersPermissions,
  apiKeys,
  plansBilling,
];
