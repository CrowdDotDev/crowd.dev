import { getConfig } from '../config'

export default function identifyTenant(user, tenant) {
  if (getConfig().SEGMENT_WRITE_KEY) {
    const Analytics = require('analytics-node')
    const analytics = new Analytics(getConfig().SEGMENT_WRITE_KEY)

    if (getConfig().EDITION === 'crowd-hosted') {
      analytics.group({
        userId: user.id,
        groupId: tenant.id,
        traits: {
          name: tenant.name,
        },
      })
    } else {
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
