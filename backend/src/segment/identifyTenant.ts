import { Edition } from '@crowd/types'
import { SEGMENT_CONFIG, API_CONFIG } from '../conf'

export default async function identifyTenant(req) {
  if (SEGMENT_CONFIG.writeKey) {
    const Analytics = require('analytics-node')
    const analytics = new Analytics(SEGMENT_CONFIG.writeKey)

    if (API_CONFIG.edition === Edition.CROWD_HOSTED || API_CONFIG.edition === Edition.LFX) {
      analytics.group({
        userId: req.currentUser.id,
        groupId: req.currentTenant.id,
        traits: {
          name: req.currentTenant.name,
        },
      })
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
