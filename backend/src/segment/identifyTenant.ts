import { SEGMENT_CONFIG, API_CONFIG } from '../config'

export default function identifyTenant(user, tenant) {
  if (SEGMENT_CONFIG.writeKey) {
    const Analytics = require('analytics-node')
    const analytics = new Analytics(SEGMENT_CONFIG.writeKey)

    if (API_CONFIG.edition === 'crowd-hosted') {
      analytics.group({
        userId: user.id,
        groupId: tenant.id,
        traits: {
          name: tenant.name,
        },
      })
    } else if (API_CONFIG.edition === 'community') {
      if (!user.email.includes('crowd.dev')) {
        analytics.group({
          userId: user.id,
          groupId: tenant.id,
          traits: {
            createdAt: tenant.createdAt,
          },
        })
      }
    }
  }
}
