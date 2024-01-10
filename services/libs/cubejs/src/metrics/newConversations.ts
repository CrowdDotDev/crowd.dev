import moment from 'moment'

import { CubeJsService } from '../service'
import { CubeDimension, CubeMeasure } from '../enums'

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
        measures: [CubeMeasure.CONVERSATION_COUNT],
        timeDimensions: [
          {
            dimension: CubeDimension.CONVERSATION_FIRST_ACTIVITY_TIME,
            dateRange: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')],
          },
        ],
        limit: 1,
      })
    )[0][CubeMeasure.CONVERSATION_COUNT] ?? 0

  return parseInt(newConversations, 10)
}
