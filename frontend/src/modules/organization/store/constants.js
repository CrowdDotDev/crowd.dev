import { formatDate } from '@/utils/date';

export const INITIAL_PAGE_SIZE = 20;

export const DEFAULT_ORGANIZATION_FILTERS = [
  {
    isTeamOrganization: {
      not: true,
    },
  },
];

export const INITIAL_VIEW_NEW_AND_ACTIVE_FILTER = {
  operator: 'and',
  attributes: {
    joinedAt: {
      name: 'joinedAt',
      label: 'Joined date',
      custom: false,
      props: {},
      defaultValue: formatDate({
        subtractDays: 30,
      }),
      value: formatDate({
        subtractDays: 30,
      }),
      defaultOperator: 'gt',
      operator: 'gt',
      type: 'date',
      expanded: false,
    },
  },
};

export const INITIAL_VIEW_TEAM_ORGANIZATIONS_FILTER = {
  operator: 'and',
  attributes: {
    isTeamOrganization: {
      name: 'isTeamOrganization',
      label: 'Team organization',
      custom: false,
      props: {},
      defaultValue: true,
      value: true,
      defaultOperator: 'eq',
      operator: 'eq',
      type: 'boolean',
      expanded: false,
    },
  },
};
