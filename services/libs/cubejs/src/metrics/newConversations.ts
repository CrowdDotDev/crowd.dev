import moment from 'moment'

import { CubeJsService } from '../service'
import CubeDimensions from '../dimensions'
import CubeMeasures from '../measures'

/**
 * Gets `new conversations` count for a given date range.
 * Conversations are new when conversation.firstActivityTime is in between given date range.
 * @param cjs cubejs service instance
 * @param startDate
 * @param endDate
 * @returns
 */
export default async (cjs: CubeJsService, startDate: moment.Moment, endDate: moment.Moment) => {
  const newConversations =
    (
      await cjs.load({
        measures: [CubeMeasures.CONVERSATION_COUNT],
        timeDimensions: [
          {
            dimension: CubeDimensions.CONVERSATION_FIRST_ACTIVITY_TIME,
            dateRange: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')],
          },
        ],
        limit: 1,
      })
    )[0][CubeMeasures.CONVERSATION_COUNT] ?? 0

  return parseInt(newConversations, 10)
}
