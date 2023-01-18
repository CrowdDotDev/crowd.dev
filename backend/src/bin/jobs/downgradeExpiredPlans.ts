import cronGenerator from 'cron-time-generator'
import { PostHog } from 'posthog-node'
import { POSTHOG_CONFIG } from '../../config'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import setPosthogTenantProperties from '../../feature-flags/setTenantProperties'
import Plans from '../../security/plans'
import { CrowdJob } from '../../types/jobTypes'
import { timeout } from '../../utils/timing'
import { createRedisClient } from '../../utils/redis'
import { createServiceChildLogger } from '../../utils/logging'

const log = createServiceChildLogger('downgradeExpiredPlansCronJob')

const job: CrowdJob = {
  name: 'Downgrade Expired Trial Plans',
  // every day
  cronTime: cronGenerator.every(1).days(),
  onTrigger: async () => {
    log.info('Downgrading expired trial plans.')
    const dbOptions = await SequelizeRepository.getDefaultIRepositoryOptions()
    const posthog = new PostHog(POSTHOG_CONFIG.apiKey, { flushAt: 1, flushInterval: 1 })
    const redis = await createRedisClient(true)

    const expiredTrialTenants = await dbOptions.database.sequelize.query(
      `select t.id, t.name from tenants t
      where t."isTrialPlan" and t."trialEndsAt" < now()`,
    )

    for (const tenant of expiredTrialTenants[0]) {
      const updatedTenant = await dbOptions.database.tenant.update(
        { isTrialPlan: false, trialEndsAt: null, plan: Plans.values.essential },
        { returning: true, raw: true, where: { id: tenant.id } },
      )

      setPosthogTenantProperties(updatedTenant[1][0], posthog, dbOptions.database, redis)
    }

    log.info('Downgrading expired non-trial plans')
    const expiredNonTrialTenants = await dbOptions.database.sequelize.query(
      `select t.id, t.name from tenants t
      where t.plan = ${Plans.values.growth} and t."planSubscriptionEndsAt" is not null and t."planSubscriptionEndsAt" + interval '3 days' < now()`,
    )

    for (const tenant of expiredNonTrialTenants[0]) {
      const updatedTenant = await dbOptions.database.tenant.update(
        { plan: Plans.values.essential },
        { returning: true, raw: true, where: { id: tenant.id } },
      )

      setPosthogTenantProperties(updatedTenant[1][0], posthog, dbOptions.database, redis)
    }

    // give time to posthog to process queue messages
    await timeout(2000)
  },
}

export default job
