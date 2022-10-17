export const chartOptions = {
  legend: false,
  curve: false,
  points: false,
  colors: ['#E94F2E'],
  backgroundColor: 'pink',
  loading: 'Loading...',
  computeDataset: (canvas) => {
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, 0, 150)
    gradient.addColorStop(0, 'rgba(253,237, 234,1)')
    gradient.addColorStop(1, 'rgba(253,237, 234,0)')
    return { backgroundColor: gradient }
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
            dateRange: `Last ${period} days`
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

export function newMembersChart(period, platform) {
  return {
    title: 'New members',
    chartOnly: true,
    settings: {
      chartType: 'area',
      unit: 'activities',
      query: {
        measures: ['Members.count'],
        timeDimensions: [
          {
            dimension: 'Members.joinedAt',
            granularity: 'day',
            dateRange: `Last ${period} days`
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
  }
}

export function activeMembersChart(period, platform) {
  return {
    title: 'Active members',
    chartOnly: true,
    settings: {
      chartType: 'area',
      unit: 'activities',
      query: {
        measures: ['Members.count'],
        timeDimensions: [
          {
            dimension: 'Activities.date',
            granularity: 'day',
            dateRange: `Last ${period} days`
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
            dimension: 'Organizations.createdat',
            granularity: 'day',
            dateRange: `Last ${period} days`
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
            dateRange: `Last ${period} days`
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

export function sentimentQuery(period, platform) {
  return {
    measures: ['Activities.count'],
    dimensions: ['Activities.sentimentMood'],
    timeDimensions: [
      {
        dimension: 'Activities.date',
        dateRange: `Last ${period} days`
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
