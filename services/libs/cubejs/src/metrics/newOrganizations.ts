import moment from 'moment'

import { CubeJsService } from '../service'
import CubeDimensions from '../dimensions'
import CubeMeasures from '../measures'

/**
 * Gets `new organizations` count for a given date range.
 * Organizations are new when organization.joinedAt is in between given date range.
 * @param cjs cubejs service instance
 * @param startDate
 * @param endDate
 * @returns
 */
export default async (cjs: CubeJsService, startDate: moment.Moment, endDate: moment.Moment) => {
  const newOrganizations =
    (
      await cjs.load({
        measures: [CubeMeasures.ORGANIZATION_COUNT],
        timeDimensions: [
          {
            dimension: CubeDimensions.ORGANIZATIONS_JOINED_AT,
            dateRange: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')],
          },
        ],
        limit: 1,
        order: { [CubeDimensions.ORGANIZATIONS_JOINED_AT]: 'asc' },
        filters: [
          {
            member: CubeDimensions.IS_TEAM_MEMBER,
            operator: 'equals',
            values: ['false'],
          },
        ],
      })
    )[0][CubeMeasures.ORGANIZATION_COUNT] ?? 0

  return parseInt(newOrganizations, 10)
}
