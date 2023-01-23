import CubeJsService from '../../services/cubejs/cubeJsService'
import CubeDimensions from '../../services/cubejs/cubeDimensions'
import CubeMeasures from '../../services/cubejs/cubeMeasures'

/**
 * Gets `new activities` count for a given date range.
 * Activities are new when activity.timestamp is in between given date range.
 * @param cjs cubejs service instance
 * @param startDate
 * @param endDate
 * @returns
 */
export default async (cjs: CubeJsService, startDate: moment.Moment, endDate: moment.Moment) => {
  const newActivities =
    (
      await cjs.load({
        measures: [CubeMeasures.ACTIVITY_COUNT],
        timeDimensions: [
          {
            dimension: CubeDimensions.ACTIVITY_DATE,
            dateRange: [startDate.toISOString(), endDate.toISOString()],
          },
        ],
        limit: 1,
        order: { [CubeDimensions.ACTIVITY_DATE]: 'asc' },
        filters: [
          {
            member: CubeDimensions.IS_TEAM_MEMBER,
            operator: "equals",
            values: [
              "false"
            ]
          }
        ]
      })
    )[0][CubeMeasures.ACTIVITY_COUNT] ?? 0

  return parseInt(newActivities, 10)
}
