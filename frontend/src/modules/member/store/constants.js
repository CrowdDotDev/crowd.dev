import { formatDate } from '@/utils/date';

export const INITIAL_PAGE_SIZE = 20;

export const DEFAULT_MEMBER_FILTERS = [
  {
    isTeamMember: {
      not: true,
    },
  },
  {
    isOrganization: {
      not: true,
    },
  },
  {
    isBot: {
      not: true,
    },
  },
];

const ACTIVITY_COUNT_BIGGER_THAN_0_FILTER = {
  activityCount: {
    name: 'activityCount',
    label: 'Activity Count',
    custom: false,
    props: {},
    defaultValue: 0,
    value: 0,
    defaultOperator: 'gt',
    operator: 'gt',
    type: 'boolean',
    expanded: false,
    show: false,
  },
};

export const INITIAL_VIEW_ALL_FILTER = {
  operator: 'and',
  attributes: {
    ...ACTIVITY_COUNT_BIGGER_THAN_0_FILTER,
  },
};

export const INITIAL_VIEW_ACTIVE_FILTER = {
  operator: 'and',
  attributes: {
    score: {
      name: 'score',
      label: 'Engagement Level',
      custom: false,
      props: {
        options: [
          {
            value: [0, 1],
            label: 'Silent',
          },
          {
            value: [2, 3],
            label: 'Quiet',
          },
          {
            value: [4, 6],
            label: 'Engaged',
          },
          {
            value: [7, 8],
            label: 'Fan',
          },
          {
            value: [9, 10],
            label: 'Ultra',
          },
        ],
        multiple: true,
      },
      defaultValue: [
        {
          value: [7, 8],
          label: 'Fan',
          selected: false,
        },
        {
          value: [9, 10],
          label: 'Ultra',
          selected: false,
        },
      ],
      value: [
        {
          value: [7, 8],
          label: 'Fan',
          selected: false,
        },
        {
          value: [9, 10],
          label: 'Ultra',
          selected: false,
        },
      ],
      defaultOperator: null,
      operator: null,
      type: 'select-multi',
      expanded: false,
    },
  },
};

export const INITIAL_VIEW_SLIPPING_AWAY_FILTER = {
  operator: 'and',
  attributes: {
    score: {
      name: 'score',
      label: 'Engagement Level',
      custom: false,
      props: {
        options: [
          {
            value: [0, 1],
            label: 'Silent',
          },
          {
            value: [2, 3],
            label: 'Quiet',
          },
          {
            value: [4, 6],
            label: 'Engaged',
          },
          {
            value: [7, 8],
            label: 'Fan',
          },
          {
            value: [9, 10],
            label: 'Ultra',
          },
        ],
        multiple: true,
      },
      defaultValue: [
        {
          value: [7, 8],
          label: 'Fan',
          selected: false,
        },
        {
          value: [9, 10],
          label: 'Ultra',
          selected: false,
        },
      ],
      value: [
        {
          value: [7, 8],
          label: 'Fan',
          selected: false,
        },
        {
          value: [9, 10],
          label: 'Ultra',
          selected: false,
        },
      ],
      defaultOperator: null,
      operator: null,
      type: 'select-multi',
      expanded: false,
    },
    lastActive: {
      name: 'lastActive',
      label: 'Last activity',
      custom: false,
      props: {},
      defaultValue: formatDate({
        subtractDays: 14,
      }),
      value: formatDate({
        subtractDays: 14,
      }),
      defaultOperator: 'lt',
      operator: 'lt',
      type: 'date',
      expanded: false,
    },
  },
};
export const INITIAL_VIEW_RECENT_FILTER = {
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
    lastActive: {
      name: 'lastActive',
      label: 'Last activity',
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

export const INITIAL_VIEW_TEAM_MEMBERS_FILTER = {
  operator: 'and',
  attributes: {
    isTeamMember: {
      name: 'isTeamMember',
      label: 'Team contributor',
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

export const INITIAL_VIEW_INFLUENTIAL_FILTER = {
  operator: 'and',
  attributes: {
    isTeamMember: {
      name: 'reach',
      label: 'Reach',
      custom: false,
      props: {},
      defaultValue: 500,
      value: 500,
      defaultOperator: 'gte',
      operator: 'gte',
      type: 'number',
      expanded: false,
    },
  },
};
