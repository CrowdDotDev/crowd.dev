import { getServiceChildLogger } from '@crowd/logging'
import { API_CONFIG, IS_TEST_ENV, SEGMENT_CONFIG } from '../conf'
import { Edition } from '../types/common'
import getTenatUser from './trackHelper'

const log = getServiceChildLogger('segment')

export default function identify(
  event,
  properties,
  options: any,
  userId: any = false,
  timestamp: any = false,
) {
  if (
    !IS_TEST_ENV &&
    SEGMENT_CONFIG.writeKey &&
    // This is only for events in the hosted version. Self-hosted has less telemetry.
    API_CONFIG.edition === Edition.CROWD_HOSTED
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
      analytics.track(payload)
    } catch (error) {
      log.error(error, { payload }, 'ERROR: Could not send the following payload to Segment')
    }
  }
}
