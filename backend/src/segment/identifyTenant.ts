import { Edition } from '@crowd/types'
import { SEGMENT_CONFIG, API_CONFIG } from '../conf'

export default async function identifyTenant(req) {
  if (SEGMENT_CONFIG.writeKey) {
    const Analytics = require('analytics-node')
    const analytics = new Analytics(SEGMENT_CONFIG.writeKey)

    if (API_CONFIG.edition === Edition.CROWD_HOSTED || API_CONFIG.edition === Edition.LFX) {
      if (!req.currentUser.email.includes('help@crowd.dev')) {
        analytics.group({
          userId: req.currentUser.id,
          groupId: req.currentTenant.id,
          traits:
            req.currentTenant.name !== 'temporaryName'
              ? {
                  name: req.currentTenant.name,
                }
              : undefined,
        })
      }
    } else if (API_CONFIG.edition === Edition.COMMUNITY) {
      if (!req.currentUser.email.includes('crowd.dev')) {
        analytics.group({
          userId: req.currentUser.id,
          groupId: req.currentTenant.id,
          traits: {
            createdAt: req.currentTenant.createdAt,
          },
        })
      }
    }
  }
}
