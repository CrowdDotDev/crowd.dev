import { getServiceChildLogger } from '@crowd/logging'
import { Edition } from '@crowd/types'
import { API_CONFIG, IS_TEST_ENV, SEGMENT_CONFIG } from '../conf'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import getTenatUser from './trackHelper'

const log = getServiceChildLogger('telemetryTrack')

export default function track(
  event,
  properties,
  options: any,
  userId: any = false,
  timestamp: any = false,
) {
  const email = SequelizeRepository.getCurrentUser({
    ...options,
  }).email
  if (
    !IS_TEST_ENV &&
    SEGMENT_CONFIG.writeKey &&
    // This is only for events in the self-hosted version. Hosted has more telemetry.
    API_CONFIG.edition === Edition.COMMUNITY &&
    !email.includes('crowd.dev')
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
