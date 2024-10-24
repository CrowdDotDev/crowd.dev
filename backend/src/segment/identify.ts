import { Edition } from '@crowd/types'

import { API_CONFIG, SEGMENT_CONFIG } from '../conf'

export default function identify(user) {
  const Analytics = require('analytics-node')

  if (SEGMENT_CONFIG.writeKey) {
    const analytics = new Analytics(SEGMENT_CONFIG.writeKey)
    if (API_CONFIG.edition === Edition.CROWD_HOSTED || API_CONFIG.edition === Edition.LFX) {
      if (user.email !== 'help@crowd.dev') {
        analytics.identify({
          userId: user.id,
          traits: {
            name: user.fullName,
            email: user.email,
            createdAt: user.createdAt,
            tenants: user.tenants.map((tenantUser) => ({
              id: tenantUser.tenant.id,
              name: tenantUser.tenant.name,
              url: tenantUser.tenant.url,
            })),
            // Hubspot custom traits
            created_an_account: true,
            created_an_account__date: user.createdAt,
          },
        })
      }
    } else if (API_CONFIG.edition === Edition.COMMUNITY) {
      if (!user.email.includes('crowd.dev')) {
        analytics.identify({
          userId: user.id,
          traits: {
            createdAt: user.createdAt,
            tenants: user.tenants.map((tenantUser) => ({
              id: tenantUser.tenant.id,
            })),
          },
        })
      }
    }
  }
}
