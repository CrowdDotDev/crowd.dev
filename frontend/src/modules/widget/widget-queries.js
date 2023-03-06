import moment from 'moment'

// Add platform and team members filters to cube query filters array
const getCubeFilters = ({ platforms, hasTeamMembers }) => {
  let filters = [
    {
      member: 'Members.isOrganization',
      operator: 'equals',
      values: ['0']
    }
  ]

  if (platforms.length) {
    filters.push({
      member: 'Activities.platform',
      operator: 'contains',
      values: platforms.map((v) => v.value)
    })
  }

  // Only add filter if team members are excluded
  if (hasTeamMembers === false) {
    filters.push({
      member: 'Members.isTeamMember',
      operator: 'equals',
      values: ['0']
    })
  }
  return filters
}

const setApiFilters = ({
  selectedPlatforms,
  selectedHasTeamMembers,
  isBot,
  filters
}) => {
  // Only add filter if team members are excluded
  if (selectedHasTeamMembers === false) {
    filters.push({
      isTeamMember: {
        not: true
      }
    })
  }

  if (isBot === false) {
    filters.push({
      isBot: {
        not: true
      }
    })
  }

  // Only add filter if there are selected platforms
  if (selectedPlatforms.length) {
    filters.push({
      or: selectedPlatforms.map((platform) => ({
        platform: { jsonContains: platform.value }
      }))
    })
  }
}

export const TOTAL_ACTIVE_MEMBERS_QUERY = ({
  period,
  granularity,
  selectedPlatforms,
  selectedHasTeamMembers
}) => ({
  measures: ['Members.count'],
  timeDimensions: [
    {
      dateRange: [
        moment()
          .utc()
          .subtract(period.value, period.granularity)
          .format('YYYY-MM-DD'),
        moment().utc().format('YYYY-MM-DD')
      ],
      dimension: 'Activities.date',
      granularity: granularity.value
    }
  ],
  filters: getCubeFilters({
    platforms: selectedPlatforms,
    hasTeamMembers: selectedHasTeamMembers
  })
})

export const TOTAL_ACTIVE_RETURNING_MEMBERS_QUERY = ({
  period,
  granularity,
  selectedPlatforms,
  selectedHasTeamMembers
}) => ({
  measures: ['Members.count'],
  timeDimensions: [
    {
      dateRange: [
        moment()
          .utc()
          .subtract(period.value, period.granularity)
          .format('YYYY-MM-DD'),
        moment().utc().format('YYYY-MM-DD')
      ],
      dimension: 'Activities.date',
      granularity: granularity.value
    }
  ],
  filters: [
    {
      member: 'Members.joinedAt',
      operator: 'beforeDate',
      values: [
        moment()
          .utc()
          .startOf('day')
          .subtract(period.value, period.granularity)
          .format('YYYY-MM-DD')
      ]
    },
    ...getCubeFilters({
      platforms: selectedPlatforms,
      hasTeamMembers: selectedHasTeamMembers
    })
  ]
})

export const TOTAL_MEMBERS_QUERY = ({
  period,
  granularity,
  selectedPlatforms,
  selectedHasTeamMembers
}) => {
  const dateRange = (period) => {
    const end = moment().utc().format('YYYY-MM-DD')
    const start = moment()
      .utc()
      .subtract(period.value, period.granularity)
      // we're subtracting one more day, to get the last value of the previous period within the same request
      .subtract(1, 'day')
      .format('YYYY-MM-DD')

    return [start, end]
  }

  return {
    measures: ['Members.cumulativeCount'],
    timeDimensions: [
      {
        dimension: 'Members.joinedAt',
        granularity: granularity.value,
        dateRange: dateRange(period)
      }
    ],
    filters: getCubeFilters({
      platforms: selectedPlatforms,
      hasTeamMembers: selectedHasTeamMembers
    })
  }
}

export const TOTAL_MEMBERS_FILTER = ({
  date,
  granularity,
  selectedPlatforms,
  selectedHasTeamMembers
}) => {
  let endDate

  if (granularity === 'day') {
    endDate = moment(date).endOf('day').toISOString()
  } else if (granularity === 'week') {
    endDate = moment(date)
      .startOf('day')
      .add(6, 'day')
      .endOf('day')
      .toISOString()
  } else if (granularity === 'month') {
    endDate = moment(date)
      .startOf('day')
      .add(1, 'month')
      .toISOString()
  }

  const filters = [
    {
      and: [
        {
          joinedAt: {
            lte: endDate
          }
        }
      ]
    }
  ]

  setApiFilters({
    filters,
    selectedHasTeamMembers,
    selectedPlatforms,
    isBot: false
  })

  return {
    and: filters
  }
}
