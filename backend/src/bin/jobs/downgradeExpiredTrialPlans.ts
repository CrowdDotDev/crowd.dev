import cronGenerator from 'cron-time-generator'
import { PostHog } from 'posthog-node'
import { POSTHOG_CONFIG } from '../../config'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import setPosthogTenantProperties from '../../feature-flags/setTenantProperties'
import Plans from '../../security/plans'
import { CrowdJob } from '../../types/jobTypes'
import { timeout } from '../../utils/timing'

const job: CrowdJob = {
  name: 'Downgrade Expired Trial Plans',
  // every day
  cronTime: cronGenerator.every(1).days(),
  onTrigger: async () => {
    console.log('in Downgrade Expired Trial Plans')
    const dbOptions = await SequelizeRepository.getDefaultIRepositoryOptions()
    const posthog = new PostHog(POSTHOG_CONFIG.apiKey, { flushAt: 1, flushInterval: 1 })

    const expiredTenants = await dbOptions.database.sequelize.query(
      `select t.id, t.name from tenants t
      where t."isTrialPlan" and t."trialEndsAt" < now()`,
    )

    for (const tenant of expiredTenants[0]) {
      const updatedTenant = await dbOptions.database.tenant.update(
        { isTrialPlan: false, trialEndsAt: null, plan: Plans.values.essential },
        { returning: true, raw: true, where: { id: tenant.id } },
      )

      setPosthogTenantProperties(updatedTenant[1][0], posthog, dbOptions.database)
    }

    // give time to posthog to process queue messages
    await timeout(2000)
  },
}

export default job
