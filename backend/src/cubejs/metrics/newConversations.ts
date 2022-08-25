import CubeJsService from '../../services/cubejs/cubeJsService'
import CubeDimensions from '../../services/cubejs/cubeDimensions'
import CubeMeasures from '../../services/cubejs/cubeMeasures'

/**
 * Gets `new conversations` count for a given date range.
 * Conversations are new when conversation.createdAt is in between given date range.
 * @param cjs cubejs service instance
 * @param startDate
 * @param endDate
 * @returns
 */
export default async (cjs: CubeJsService, startDate: moment.Moment, endDate: moment.Moment) => {
  const newConversations =
    parseInt(
      (
        await cjs.load({
          measures: [CubeMeasures.CONVERSATION_COUNT],
          timeDimensions: [
            {
              dimension: CubeDimensions.CONVERSATION_CREATED_AT,
              dateRange: [startDate.toISOString(), endDate.toISOString()],
            },
          ],
          limit: 1,
        })
      )[0][CubeMeasures.CONVERSATION_COUNT],
      10,
    ) ?? 0

  return newConversations
}
