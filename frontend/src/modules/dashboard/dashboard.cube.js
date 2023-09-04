import moment from 'moment';

export const dashboardChartOptions = {
  legend: false,
  yTicks: false,
  yLines: false,
  xTicksCallback: (label) => moment(label).format('MMM DD'),
  gradient: {
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 100,
    stops: [
      {
        offset: 0.38,
        color: 'rgba(253,237, 234,1)',
      },
      {
        offset: 1,
        color: 'rgba(253,237, 234,0)',
      },
    ],
  },
  legendPlugin: false,
};

export function dateRange(period) {
  const end = moment().utc().endOf('day');
  const start = moment()
    .subtract(
      period.value - 1,
      period.granularity,
    )
    .utc()
    .startOf('day');
  return [start, end];
}

export const hideLabels = {
  scales: {
    x: {
      ticks: {
        display: false,
      },
    },
    y: {
      ticks: {
        display: false,
      },
      grid: {
        drawBorder: false,
      },
    },
  },
};

export function activitiesChart(period, platform) {
  return {
    measures: ['Activities.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        granularity: 'day',
        dateRange: dateRange(period),
      },
    ],
    filters:
      platform !== 'all'
        ? [
          {
            member: 'Activities.platform',
            operator: 'equals',
            values: [platform],
          },
        ]
        : undefined,
  };
}

export function activitiesCount(range, platform) {
  return {
    measures: ['Activities.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange: range,
      },
    ],
    filters:
      platform !== 'all'
        ? [
          {
            member: 'Activities.platform',
            operator: 'equals',
            values: [platform],
          },
        ]
        : undefined,
  };
}

export function activityTypes(period, platform) {
  return {
    measures: ['Activities.count'],
    order: {
      'Activities.count': 'desc',
    },
    dimensions: ['Activities.platform', 'Activities.type'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange: dateRange(period),
      },
    ],
    filters:
      platform !== 'all'
        ? [
          {
            member: 'Activities.platform',
            operator: 'equals',
            values: [platform],
          },
        ]
        : undefined,
  };
}

const getMembersFilters = (platform) => {
  const filters = [
    {
      member: 'Members.isOrganization',
      operator: 'equals',
      values: ['0'],
    },
  ];

  if (platform !== 'all') {
    filters.push({
      member: 'Activities.platform',
      operator: 'equals',
      values: [platform],
    });
  }

  return filters;
};

export function newMembersChart(period, platform) {
  return {
    measures: ['Members.count'],
    timeDimensions: [
      {
        dimension: 'Members.joinedAt',
        granularity: 'day',
        dateRange: dateRange(period),
      },
    ],
    filters: getMembersFilters(platform),
  };
}

export function newMembersCount(range, platform) {
  return {
    measures: ['Members.count'],
    timeDimensions: [
      {
        dimension: 'Members.joinedAt',
        dateRange: range,
      },
    ],
    filters: getMembersFilters(platform),
  };
}

export function activeMembersChart(period, platform) {
  return {
    measures: ['Members.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        granularity: 'day',
        dateRange: dateRange(period),
      },
    ],
    filters: getMembersFilters(platform),
  };
}

export function activeMembersCount(range, platform) {
  return {
    measures: ['Members.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange: range,
      },
    ],
    filters: getMembersFilters(platform),
  };
}

export function newOrganizationChart(period, platform) {
  return {
    measures: ['Organizations.count'],
    timeDimensions: [
      {
        dimension: 'Organizations.joinedAt',
        granularity: 'day',
        dateRange: dateRange(period),
      },
    ],
    filters:
      platform !== 'all'
        ? [
          {
            member: 'Activities.platform',
            operator: 'equals',
            values: [platform],
          },
        ]
        : undefined,
  };
}

export function newOrganizationCount(range, platform) {
  return {
    measures: ['Organizations.count'],
    timeDimensions: [
      {
        dimension: 'Organizations.joinedAt',
        dateRange: range,
      },
    ],
    filters:
      platform !== 'all'
        ? [
          {
            member: 'Activities.platform',
            operator: 'equals',
            values: [platform],
          },
        ]
        : undefined,
  };
}

export function activeOrganizationChart(period, platform) {
  return {
    measures: ['Organizations.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        granularity: 'day',
        dateRange: dateRange(period),
      },
    ],
    filters:
      platform !== 'all'
        ? [
          {
            member: 'Activities.platform',
            operator: 'equals',
            values: [platform],
          },
        ]
        : undefined,
  };
}

export function activeOrganizationCount(
  range,
  platform,
) {
  return {
    measures: ['Organizations.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange: range,
      },
    ],
    filters:
      platform !== 'all'
        ? [
          {
            member: 'Activities.platform',
            operator: 'equals',
            values: [platform],
          },
        ]
        : undefined,
  };
}

export function sentimentQuery(period, platform) {
  return {
    measures: ['Activities.count'],
    dimensions: ['Activities.sentimentMood'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange: dateRange(period),
      },
    ],
    filters:
      platform !== 'all'
        ? [
          {
            member: 'Activities.platform',
            operator: 'equals',
            values: [platform],
          },
        ]
        : undefined,
  };
}
