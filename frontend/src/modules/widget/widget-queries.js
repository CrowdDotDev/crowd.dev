import moment from 'moment';

// Add platform and team members filters to cube query filters array
const getCubeFilters = ({
  platforms,
  hasTeamMembers,
  hasTeamActivities,
  isContribution,
}) => {
  const filters = [
    {
      member: 'Members.isOrganization',
      operator: 'equals',
      values: ['0'],
    },
  ];

  if (platforms.length) {
    filters.push({
      member: 'Activities.platform',
      operator: 'contains',
      values: platforms.map((v) => v.value),
    });
  }

  // Only add filter if team members or team activities are excluded
  if (hasTeamMembers === false || hasTeamActivities === false) {
    filters.push({
      member: 'Members.isTeamMember',
      operator: 'equals',
      values: ['0'],
    });
  }

  if (isContribution) {
    filters.push({
      member: 'Activities.iscontribution',
      operator: 'equals',
      values: ['1'],
    });
  }

  return filters;
};

const setApiFilters = ({
  selectedPlatforms,
  selectedHasTeamMembers,
  isBot,
  filters,
}) => {
  if (selectedHasTeamMembers === false) {
    filters.push({
      isTeamMember: {
        not: true,
      },
    });
  } else {
    filters.push({
      or: [
        {
          isTeamMember: {
            not: true,
          },
        },
        {
          isTeamMember: {
            eq: true,
          },
        },
      ],
    });
  }

  if (isBot === false) {
    filters.push({
      isBot: {
        not: true,
      },
    });
  }

  // Only add filter if there are selected platforms
  if (selectedPlatforms.length) {
    filters.push({
      or: selectedPlatforms.map((platform) => ({
        identities: { contains: [platform.value] },
      })),
    });
  }
};

export const TOTAL_ACTIVE_MEMBERS_QUERY = ({
  period,
  granularity,
  selectedPlatforms,
  selectedHasTeamMembers,
}) => ({
  measures: ['Members.count'],
  timeDimensions: [
    {
      dateRange: [
        moment()
          .utc()
          .subtract(period.granularity === 'day' ? period.value - 1 : period.value, period.granularity)
          .format('YYYY-MM-DD'),
        moment().utc().format('YYYY-MM-DD'),
      ],
      dimension: 'Activities.date',
      granularity: granularity.value,
    },
  ],
  filters: getCubeFilters({
    platforms: selectedPlatforms,
    hasTeamMembers: selectedHasTeamMembers,
  }),
});

export const TOTAL_ACTIVE_RETURNING_MEMBERS_QUERY = ({
  period,
  granularity,
  selectedPlatforms,
  selectedHasTeamMembers,
}) => ({
  measures: ['Members.count'],
  timeDimensions: [
    {
      dateRange: [
        moment()
          .utc()
          .subtract(period.granularity === 'day' ? period.value - 1 : period.value, period.granularity)
          .format('YYYY-MM-DD'),
        moment().utc().format('YYYY-MM-DD'),
      ],
      dimension: 'Activities.date',
      granularity: granularity.value,
    },
  ],
  filters: [
    {
      member: 'Members.joinedAtUnixTs',
      operator: 'lt',
      values: [
        moment()
          .utc()
          .startOf('day')
          .subtract(period.value, period.granularity)
          .unix()
          .toString(),
      ],
    },
    ...getCubeFilters({
      platforms: selectedPlatforms,
      hasTeamMembers: selectedHasTeamMembers,
    }),
  ],
});

export const TOTAL_MEMBERS_QUERY = ({
  period,
  granularity,
  selectedPlatforms,
  selectedHasTeamMembers,
}) => {
  const dateRange = (periodValue) => {
    const end = moment().utc().format('YYYY-MM-DD');
    const start = moment()
      .utc()
      // we're subtracting one more day, to get the last value of the previous period within the same request
      .subtract(periodValue.value, periodValue.granularity)
      .format('YYYY-MM-DD');

    return [start, end];
  };

  return {
    measures: ['Members.cumulativeCount'],
    timeDimensions: [
      {
        dimension: 'Members.joinedAt',
        granularity: granularity.value,
        dateRange: dateRange(period),
      },
    ],
    filters: getCubeFilters({
      platforms: selectedPlatforms,
      hasTeamMembers: selectedHasTeamMembers,
    }),
  };
};

export const TOTAL_MEMBERS_FILTER = ({
  date,
  granularity,
  selectedPlatforms,
  selectedHasTeamMembers,
}) => {
  let endDate;

  if (granularity === 'day') {
    endDate = moment(date).endOf('day').toISOString();
  } else if (granularity === 'week') {
    endDate = moment(date)
      .startOf('day')
      .add(6, 'day')
      .endOf('day')
      .toISOString();
  } else if (granularity === 'month') {
    endDate = moment(date)
      .startOf('day')
      .add(1, 'month')
      .toISOString();
  }

  const filters = [
    {
      and: [
        {
          isOrganization: {
            not: true,
          },
        },
        {
          joinedAt: {
            lte: endDate,
          },
        },
      ],
    },
  ];

  setApiFilters({
    filters,
    selectedHasTeamMembers,
    selectedPlatforms,
    isBot: false,
  });

  return {
    and: filters,
  };
};

// Update to correct query, when there's support in backend
export const TOTAL_MONTHLY_ACTIVE_CONTRIBUTORS = ({
  period,
  granularity,
  selectedHasTeamMembers,
}) => ({
  measures: ['Members.count'],
  timeDimensions: [
    {
      ...(period.value
        && period.granularity && {
        dateRange: [
          moment()
            .utc()
            .startOf('month')
            .subtract(period.value, period.granularity)
            .format('YYYY-MM-DD'),
          moment().utc().format('YYYY-MM-DD'),
        ],
      }),
      dimension: 'Activities.date',
      granularity: granularity.value,
    },
  ],
  filters: getCubeFilters({
    platforms: [],
    hasTeamMembers: selectedHasTeamMembers,
    isContribution: true,
  }),
});

export const ACTIVITIES_QUERY = ({
  period,
  granularity,
  selectedPlatforms,
  selectedHasTeamActivities,
}) => ({
  measures: ['Activities.count'],
  timeDimensions: [
    {
      dateRange: [
        moment()
          .utc()
          .subtract(period.granularity === 'day' ? period.value - 1 : period.value, period.granularity)
          .format('YYYY-MM-DD'),
        moment().utc().format('YYYY-MM-DD'),
      ],
      dimension: 'Activities.date',
      granularity: granularity.value,
    },
  ],
  filters: getCubeFilters({
    platforms: selectedPlatforms,
    hasTeamActivities: selectedHasTeamActivities,
  }),
});

export const LEADERBOARD_ACTIVITIES_TYPES_QUERY = ({
  period,
  selectedPlatforms,
  selectedHasTeamActivities,
}) => ({
  measures: ['Activities.count'],
  order: {
    'Activities.count': 'desc',
  },
  dimensions: ['Activities.platform', 'Activities.type'],
  timeDimensions: [
    {
      dateRange: [
        moment()
          .utc()
          .subtract(period.granularity === 'day' ? period.value - 1 : period.value, period.granularity)
          .format('YYYY-MM-DD'),
        moment().utc().format('YYYY-MM-DD'),
      ],
      dimension: 'Activities.date',
    },
  ],
  filters:
    getCubeFilters({
      platforms: selectedPlatforms,
      hasTeamActivities: selectedHasTeamActivities,
    }),

});

export const LEADERBOARD_ACTIVITIES_COUNT_QUERY = ({
  period,
  selectedPlatforms,
  selectedHasTeamActivities,
}) => ({
  measures: ['Activities.count'],
  timeDimensions: [
    {
      dateRange: [
        moment()
          .utc()
          .subtract(period.granularity === 'day' ? period.value - 1 : period.value, period.granularity)
          .format('YYYY-MM-DD'),
        moment().utc().format('YYYY-MM-DD'),
      ],
      dimension: 'Activities.date',
    },
  ],
  filters:
    getCubeFilters({
      platforms: selectedPlatforms,
      hasTeamActivities: selectedHasTeamActivities,
    }),

});

export const TOTAL_ACTIVITIES_QUERY = ({
  period,
  granularity,
  selectedPlatforms,
  selectedHasTeamActivities,
}) => {
  const dateRange = (periodValue) => {
    const end = moment().utc().format('YYYY-MM-DD');
    const start = moment()
      .utc()
      // we're subtracting one more day, to get the last value of the previous period within the same request
      .subtract(periodValue.value, periodValue.granularity)
      .format('YYYY-MM-DD');

    return [start, end];
  };

  return {
    measures: ['Activities.cumulativeCount'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        granularity: granularity.value,
        dateRange: dateRange(period),
      },
    ],
    filters: getCubeFilters({
      platforms: selectedPlatforms,
      hasTeamMembers: selectedHasTeamActivities,
    }),
  };
};
