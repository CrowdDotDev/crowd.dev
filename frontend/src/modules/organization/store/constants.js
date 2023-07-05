import { formatDate } from '@/utils/date';

export const INITIAL_PAGE_SIZE = 20;

export const DEFAULT_ORGANIZATION_FILTERS = [
  {
    isTeamOrganization: {
      not: true,
    },
  },
];
