import moment from 'moment'

import { CubeJsService } from '../service'
import { CubeGranularity, CubeDimension, CubeMeasure, CubeOrderDirection } from '../enums'
import { ICubeFilter, ICubeOrder, IDashboardFilter } from '../types'

/**
 * Gets `new members` count or timeseries data for a given date range and granularity.
 * Members are new when member.joinedAt is in between given date range.
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
  filter: IDashboardFilter = {},
  order: ICubeOrder = { [CubeDimension.MEMBER_JOINED_AT]: CubeOrderDirection.ASC },
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
    {
      member: CubeDimension.IS_ORGANIZATION,
      operator: 'equals',
      values: ['false'],
    },
  ]

  if (filter.platform) {
    filters.push({
      member: CubeDimension.MEMBER_IDENTITIES_PLATFORM,
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

  const query = {
    measures: [CubeMeasure.MEMBER_COUNT],
    timeDimensions: [
      {
        dimension: CubeDimension.MEMBER_JOINED_AT,
        dateRange: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')],
        granularity,
      },
    ],
    order,
    filters,
  }

  const newMembers = await cjs.load(query, rawResult)

  if (rawResult || granularity) {
    return newMembers
  }
  const parsedResult = newMembers[0][CubeMeasure.MEMBER_COUNT] ?? 0

  return parseInt(parsedResult, 10)
}
