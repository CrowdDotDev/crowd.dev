import moment from 'moment'

import { CubeJsService } from '../service'
import { CubeGranularity, CubeOrderDirection, CubeDimension, CubeMeasure } from '../enums'
import { ICubeFilter, ICubeOrder, IDashboardFilter } from '../types'

/**
 * Gets `new activities` count for a given date range.
 * Activities are new when activity.timestamp is in between given date range.
 * @param cjs cubejs service instance
 * @param startDate
 * @param endDate
 * @returns
 */
export default async (
  cjs: CubeJsService,
  startDate: moment.Moment,
  endDate: moment.Moment,
  granularity: CubeGranularity | string = null,
  dimensions: CubeDimension[] | string[] = [],
  filter: IDashboardFilter = {},
  order: ICubeOrder = { [CubeDimension.ACTIVITY_DATE]: CubeOrderDirection.ASC },
  rawResult = false,
) => {
  const filters: ICubeFilter[] = [
    {
      member: CubeDimension.IS_TEAM_MEMBER,
      operator: 'equals',
      values: ['false'],
    },
    {
      member: CubeDimension.IS_BOT,
      operator: 'equals',
      values: ['false'],
    },
  ]

  if (filter.platform) {
    filters.push({
      member: CubeDimension.ACTIVITY_PLATFORM,
      operator: 'equals',
      values: [filter.platform],
    })
  }

  if (filter.segments) {
    filters.push({
      member: CubeDimension.SEGMENTS_ID,
      operator: 'equals',
      values: filter.segments,
    })
  }

  const newActivities = await cjs.load(
    {
      measures: [CubeMeasure.ACTIVITY_COUNT],
      dimensions,
      timeDimensions: [
        {
          dimension: CubeDimension.ACTIVITY_DATE,
          dateRange: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')],
          granularity,
        },
      ],
      order,
      filters,
    },
    rawResult,
  )

  if (rawResult || granularity) {
    return newActivities
  }

  const parsedResult = newActivities[0][CubeMeasure.ACTIVITY_COUNT] ?? 0

  return parseInt(parsedResult, 10)
}
