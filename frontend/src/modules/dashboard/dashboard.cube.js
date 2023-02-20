import moment from 'moment'

export const dashboardChartOptions = {
  legend: false,
  yTicks: false,
  yLines: false,
  xTicksCallback: (label) => {
    return moment(label).format('MMM DD')
  },
  gradient: {
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 100,
    stops: [
      {
        offset: 0.38,
        color: 'rgba(253,237, 234,1)'
      },
      {
        offset: 1,
        color: 'rgba(253,237, 234,0)'
      }
    ]
  }
}

export function dateRange(period) {
  const end = moment().utc().endOf('day')
  const start = moment()
    .subtract(
      period.granularity === 'day'
        ? period.value - 1
        : period.value,
      period.granularity
    )
    .utc()
    .startOf('day')
  return [start, end]
}

export const hideLabels = {
  scales: {
    x: {
      ticks: {
        display: false
      }
    },
    y: {
      ticks: {
        display: false
      },
      grid: {
        drawBorder: false
      }
    }
  }
}

export function activitiesChart(period, platform) {
  return {
    title: 'Activities',
    chartOnly: true,
    settings: {
      chartType: 'area',
      unit: 'activities',
      query: {
        measures: ['Activities.count'],
        timeDimensions: [
          {
            dimension: 'Activities.date',
            granularity: 'day',
            dateRange: dateRange(period)
          }
        ],
        filters:
          platform !== 'all'
            ? [
                {
                  member: 'Activities.platform',
                  operator: 'equals',
                  values: [platform]
                }
              ]
            : undefined
      }
    },
    unit: 'activities'
  }
}

export function activitiesCount(dateRange, platform) {
  return {
    measures: ['Activities.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange
      }
    ],
    filters:
      platform !== 'all'
        ? [
            {
              member: 'Activities.platform',
              operator: 'equals',
              values: [platform]
            }
          ]
        : undefined
  }
}

export function activityTypes(period, platform) {
  return {
    measures: ['Activities.count'],
    order: {
      'Activities.count': 'desc'
    },
    dimensions: ['Activities.platform', 'Activities.type'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange: dateRange(period)
      }
    ],
    filters:
      platform !== 'all'
        ? [
            {
              member: 'Activities.platform',
              operator: 'equals',
              values: [platform]
            }
          ]
        : undefined
  }
}

export function newMembersChart(period, platform) {
  return {
    measures: ['Members.count'],
    timeDimensions: [
      {
        dimension: 'Members.joinedAt',
        granularity: 'day',
        dateRange: dateRange(period)
      }
    ],
    filters:
      platform !== 'all'
        ? [
            {
              member: 'Activities.platform',
              operator: 'equals',
              values: [platform]
            }
          ]
        : undefined
  }
}

export function newMembersCount(dateRange, platform) {
  return {
    measures: ['Members.count'],
    timeDimensions: [
      {
        dimension: 'Members.joinedAt',
        dateRange
      }
    ],
    filters:
      platform !== 'all'
        ? [
            {
              member: 'Activities.platform',
              operator: 'equals',
              values: [platform]
            }
          ]
        : undefined
  }
}

export function activeMembersChart(period, platform) {
  return {
    measures: ['Members.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        granularity: 'day',
        dateRange: dateRange(period)
      }
    ],
    filters:
      platform !== 'all'
        ? [
            {
              member: 'Activities.platform',
              operator: 'equals',
              values: [platform]
            }
          ]
        : undefined
  }
}

export function activeMembersCount(dateRange, platform) {
  return {
    measures: ['Members.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange
      }
    ],
    filters:
      platform !== 'all'
        ? [
            {
              member: 'Activities.platform',
              operator: 'equals',
              values: [platform]
            }
          ]
        : undefined
  }
}

export function newOrganizationChart(period, platform) {
  return {
    title: 'New Organizations',
    chartOnly: true,
    settings: {
      chartType: 'area',
      unit: 'activities',
      query: {
        measures: ['Organizations.count'],
        timeDimensions: [
          {
            dimension: 'Organizations.joinedAt',
            granularity: 'day',
            dateRange: dateRange(period)
          }
        ],
        filters:
          platform !== 'all'
            ? [
                {
                  member: 'Activities.platform',
                  operator: 'equals',
                  values: [platform]
                }
              ]
            : undefined
      }
    },
    unit: 'activities'
  }
}

export function newOrganizationCount(dateRange, platform) {
  return {
    measures: ['Organizations.count'],
    timeDimensions: [
      {
        dimension: 'Organizations.joinedAt',
        dateRange
      }
    ],
    filters:
      platform !== 'all'
        ? [
            {
              member: 'Activities.platform',
              operator: 'equals',
              values: [platform]
            }
          ]
        : undefined
  }
}

export function activeOrganizationChart(period, platform) {
  return {
    title: 'Active organizations',
    chartOnly: true,
    settings: {
      chartType: 'area',
      unit: 'activities',
      query: {
        measures: ['Organizations.count'],
        timeDimensions: [
          {
            dimension: 'Activities.date',
            granularity: 'day',
            dateRange: dateRange(period)
          }
        ],
        filters:
          platform !== 'all'
            ? [
                {
                  member: 'Activities.platform',
                  operator: 'equals',
                  values: [platform]
                }
              ]
            : undefined
      }
    },
    unit: 'activities'
  }
}

export function activeOrganizationCount(
  dateRange,
  platform
) {
  return {
    measures: ['Organizations.count'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange
      }
    ],
    filters:
      platform !== 'all'
        ? [
            {
              member: 'Activities.platform',
              operator: 'equals',
              values: [platform]
            }
          ]
        : undefined
  }
}

export function sentimentQuery(period, platform) {
  return {
    measures: ['Activities.count'],
    dimensions: ['Activities.sentimentMood'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange: dateRange(period)
      }
    ],
    filters:
      platform !== 'all'
        ? [
            {
              member: 'Activities.platform',
              operator: 'equals',
              values: [platform]
            }
          ]
        : undefined
  }
}
