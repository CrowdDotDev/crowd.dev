import { getConfig } from '../config'
import getTenatUser from './trackHelper'

export default function identify(
  event,
  properties,
  options: any,
  userId: any = false,
  timestamp: any = false,
) {
  if (
    process.env.NODE_ENV !== 'test' &&
    getConfig().SEGMENT_WRITE_KEY &&
    // This is only for events in the hosted version. Self-hosted has less telemetry.
    getConfig().EDITION === 'crowd-hosted'
  ) {
    const Analytics = require('analytics-node')
    const analytics = new Analytics(getConfig().SEGMENT_WRITE_KEY)

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
      console.log('ERROR: Could not send the following payload to Segment', payload)
    }
  }
}
