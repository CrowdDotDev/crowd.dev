import moment from 'moment'

import { CubeJsService } from '../service'
import CubeDimensions from '../dimensions'
import CubeMeasures from '../measures'

/**
 * Gets `active members` count for a given date range.
 * Members are active when they have an activity in given date range.
 * @param cjs cubejs service instance
 * @param startDate
 * @param endDate
 * @returns
 */
export default async (cjs: CubeJsService, startDate: moment.Moment, endDate: moment.Moment) => {
  const activeMembers =
    (
      await cjs.load({
        measures: [CubeMeasures.MEMBER_COUNT],
        timeDimensions: [
          {
            dimension: CubeDimensions.ACTIVITY_DATE,
            dateRange: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')],
          },
        ],
        limit: 1,
        order: { [CubeDimensions.MEMBER_JOINED_AT]: 'asc' },
        filters: [
          {
            member: CubeDimensions.IS_TEAM_MEMBER,
            operator: 'equals',
            values: ['false'],
          },
        ],
      })
    )[0][CubeMeasures.MEMBER_COUNT] ?? 0

  return parseInt(activeMembers, 10)
}
