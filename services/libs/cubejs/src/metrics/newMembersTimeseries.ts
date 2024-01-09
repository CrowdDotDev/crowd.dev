import moment from 'moment'

import { CubeJsService } from '../service'
import CubeDimensions from '../dimensions'
import CubeMeasures from '../measures'
import { ICubeFilter } from 'types'
import { CubeGranularity } from '../enums'

/**
 * Gets `new members` timeseries data for a given date range in given granularity.
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
  granularity: CubeGranularity = CubeGranularity.DAY,
  platform: string = undefined,
  segment: string = undefined,
) => {
  const filters: ICubeFilter[] = [
    {
      member: CubeDimensions.IS_TEAM_MEMBER,
      operator: 'equals',
      values: ['false'],
    },
    {
      member: CubeDimensions.IS_BOT,
      operator: 'equals',
      values: ['false'],
    },
    {
      member: CubeDimensions.IS_ORGANIZATION,
      operator: 'equals',
      values: ['false'],
    },
  ]

  if (platform) {
    filters.push({
      member: CubeDimensions.ACTIVITY_PLATFORM,
      operator: 'equals',
      values: [platform],
    })
  }

  if (segment) {
    filters.push({
      member: CubeDimensions.SEGMENTS_ID,
      operator: 'equals',
      values: [segment],
    })
  }

  const query = {
    measures: [CubeMeasures.MEMBER_COUNT],
    timeDimensions: [
      {
        dimension: CubeDimensions.MEMBER_JOINED_AT,
        dateRange: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')],
        granularity,
      },
    ],
    filters,
  }

  cjs.log.info(query)

  const newMembersTimeseries = await cjs.load(query)

  return newMembersTimeseries || []
}
