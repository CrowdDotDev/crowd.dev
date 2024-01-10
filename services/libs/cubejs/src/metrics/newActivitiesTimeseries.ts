import moment from 'moment'

import { CubeJsService } from '../service'
import { ICubeFilter } from '../types'
import { CubeGranularity, CubeDimension, CubeMeasure } from '../enums'

/**
 * Gets `new activities` timeseries data for a given date range in given granularity.
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
  granularity: CubeGranularity = CubeGranularity.DAY,
  platform: string = undefined,
  segment: string = undefined,
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

  if (platform) {
    filters.push({
      member: CubeDimension.ACTIVITY_PLATFORM,
      operator: 'equals',
      values: [platform],
    })
  }

  if (segment) {
    filters.push({
      member: CubeDimension.SEGMENTS_ID,
      operator: 'equals',
      values: [segment],
    })
  }

  const query = {
    measures: [CubeMeasure.ACTIVITY_COUNT],
    timeDimensions: [
      {
        dimension: CubeDimension.ACTIVITY_DATE,
        dateRange: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')],
        granularity,
      },
    ],
    filters,
  }

  cjs.log.info(query)

  const newActivitiesTimeseries = await cjs.load(query)

  return newActivitiesTimeseries || []
}
