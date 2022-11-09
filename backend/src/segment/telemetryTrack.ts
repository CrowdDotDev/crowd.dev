import { createServiceChildLogger } from '../utils/logging'
import { SEGMENT_CONFIG, API_CONFIG, IS_TEST_ENV } from '../config'
import getTenatUser from './trackHelper'

const log = createServiceChildLogger('telemetryTrack')

export default function identify(
  event,
  properties,
  options: any,
  userId: any = false,
  timestamp: any = false,
) {
  if (event === 'Conversation created') {
    log.trace('Conversation created')
  }
  if (
    !IS_TEST_ENV &&
    SEGMENT_CONFIG.writeKey &&
    // This is only for events in the hosted version. Self-hosted has less telemetry.
    API_CONFIG.edition !== 'crowd-hosted'
  ) {
    const Analytics = require('analytics-node')
    const analytics = new Analytics(SEGMENT_CONFIG.writeKey)

    const { userIdOut, tenantIdOut } = getTenatUser(userId, options)

    const payload = {
      userId: userIdOut,
      event,
      properties,
      context: {
        groupId: tenantIdOut,
      },
      ...(timestamp && { timestamp }),
    }

    try {
      if (event === 'Conversation created') {
        log.trace('Added conversation')
      }
      analytics.track(payload)
    } catch (error) {
      log.error(error, { payload }, 'ERROR: Could not send the following payload to Segment')
    }
  }
}
