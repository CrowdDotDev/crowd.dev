import moment from 'moment'

export const TOTAL_ACTIVE_MEMBERS_QUERY = (
  period,
  granularity
) => ({
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
  ]
})

export const TOTAL_ACTIVE_RETURNING_MEMBERS_QUERY = (
  period,
  granularity
) => ({
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
    }
  ]
})
