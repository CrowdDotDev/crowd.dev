import moment from 'moment'

import { CubeJsService } from '../service'
import CubeDimensions from '../dimensions'
import CubeMeasures from '../measures'
import { ICubeFilter } from 'types'
import { CubeGranularity } from '../enums'

/**
 * Gets `active organizations` timeseries data for a given date range in given granularity.
 * Organizations are active when they have an activity in given date range.
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
    measures: [CubeMeasures.ORGANIZATION_COUNT],
    timeDimensions: [
      {
        dimension: CubeDimensions.ACTIVITY_DATE,
        dateRange: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')],
        granularity,
      },
    ],
    filters,
  }

  cjs.log.info(query)

  const activeOrganizationsTimeseries = await cjs.load(query)

  return activeOrganizationsTimeseries || []
}
