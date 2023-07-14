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
        color: 'rgba(0, 148, 255, 0.10)',
      },
      {
        offset: 1,
        color: 'rgba(0, 148, 255, 0.00)',
      },
    ],
  },
  legendPlugin: false,
};

export function dateRange(period) {
  const end = moment().utc().endOf('day');
  const start = moment()
    .subtract(
      period.granularity === 'day'
        ? period.value - 1
        : period.value,
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

const getFilters = (platform, segments) => {
  const filters = [];

  if (platform !== 'all') {
    filters.push({
      member: 'Activities.platform',
      operator: 'equals',
      values: [platform],
    });
  }

  if (segments.length) {
    filters.push({
      member: 'Segments.id',
      operator: 'equals',
      values: segments,
    });
  }

  return filters.length ? filters : undefined;
};

export function activitiesChart(period, platform, segments) {
  return {
    measures: ['Activities.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        granularity: 'day',
        dateRange: dateRange(period),
      },
    ],
    filters: getFilters(platform, segments),
  };
}

export function activitiesCount(range, platform, segments) {
  return {
    measures: ['Activities.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange: range,
      },
    ],
    filters: getFilters(platform, segments),
  };
}

export function activityTypes(period, platform, segments) {
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
    filters: getFilters(platform, segments),
  };
}

const getMembersFilters = (platform, segments) => {
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

  if (segments.length) {
    filters.push({
      member: 'Segments.id',
      operator: 'equals',
      values: segments,
    });
  }

  return filters;
};

export function newMembersChart(period, platform, segments) {
  return {
    measures: ['Members.count'],
    timeDimensions: [
      {
        dimension: 'Members.joinedAt',
        granularity: 'day',
        dateRange: dateRange(period),
      },
    ],
    filters: getMembersFilters(platform, segments),
  };
}

export function newMembersCount(range, platform, segments) {
  return {
    measures: ['Members.count'],
    timeDimensions: [
      {
        dimension: 'Members.joinedAt',
        dateRange: range,
      },
    ],
    filters: getMembersFilters(platform, segments),
  };
}

export function activeMembersChart(period, platform, segments) {
  return {
    measures: ['Members.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        granularity: 'day',
        dateRange: dateRange(period),
      },
    ],
    filters: getMembersFilters(platform, segments),
  };
}

export function activeMembersCount(range, platform, segments) {
  return {
    measures: ['Members.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange: range,
      },
    ],
    filters: getMembersFilters(platform, segments),
  };
}

export function newOrganizationChart(period, platform, segments) {
  return {
    measures: ['Organizations.count'],
    timeDimensions: [
      {
        dimension: 'Organizations.joinedAt',
        granularity: 'day',
        dateRange: dateRange(period),
      },
    ],
    filters: getFilters(platform, segments),
  };
}

export function newOrganizationCount(range, platform, segments) {
  return {
    measures: ['Organizations.count'],
    timeDimensions: [
      {
        dimension: 'Organizations.joinedAt',
        dateRange: range,
      },
    ],
    filters: getFilters(platform, segments),
  };
}

export function activeOrganizationChart(period, platform, segments) {
  return {
    measures: ['Organizations.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        granularity: 'day',
        dateRange: dateRange(period),
      },
    ],
    filters: getFilters(platform, segments),
  };
}

export function activeOrganizationCount(
  range,
  platform,
  segments,
) {
  return {
    measures: ['Organizations.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange: range,
      },
    ],
    filters: getFilters(platform, segments),
  };
}

export function sentimentQuery(period, platform, segments) {
  return {
    measures: ['Activities.count'],
    dimensions: ['Activities.sentimentMood'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange: dateRange(period),
      },
    ],
    filters: getFilters(platform, segments),
  };
}
