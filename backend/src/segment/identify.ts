import { getConfig } from '../config'

export default function identify(user) {
  const Analytics = require('analytics-node')

  if (getConfig().SEGMENT_WRITE_KEY) {
    const analytics = new Analytics(getConfig().SEGMENT_WRITE_KEY)
    if (getConfig().EDITION === 'crowd-hosted') {
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
    } else {
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
