import { getServiceChildLogger } from '@crowd/logging'
import cronGenerator from 'cron-time-generator'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import Plans from '../../security/plans'
import { CrowdJob } from '../../types/jobTypes'

const log = getServiceChildLogger('downgradeExpiredPlansCronJob')

const job: CrowdJob = {
  name: 'Downgrade Expired Trial Plans',
  // every day
  cronTime: cronGenerator.every(1).days(),
  onTrigger: async () => {
    log.info('Downgrading expired trial plans.')
    const dbOptions = await SequelizeRepository.getDefaultIRepositoryOptions()

    const expiredTrialTenants = await dbOptions.database.sequelize.query(
      `select t.id, t.name from tenants t
      where t."isTrialPlan" and t."trialEndsAt" < now()`,
    )

    for (const tenant of expiredTrialTenants[0]) {
      await dbOptions.database.tenant.update(
        { isTrialPlan: false, trialEndsAt: null, plan: Plans.values.essential },
        { returning: true, raw: true, where: { id: tenant.id } },
      )
    }

    log.info('Downgrading expired non-trial plans')
    const expiredNonTrialTenants = await dbOptions.database.sequelize.query(
      `select t.id, t.name from tenants t
      where (t.plan = ${Plans.values.growth} or t.plan = ${Plans.values.eagleEye} or t.plan = ${Plans.values.scale}) and t."planSubscriptionEndsAt" is not null and t."planSubscriptionEndsAt" + interval '3 days' < now()`,
    )

    for (const tenant of expiredNonTrialTenants[0]) {
      await dbOptions.database.tenant.update(
        { plan: Plans.values.essential },
        { returning: true, raw: true, where: { id: tenant.id } },
      )
    }
  },
}

export default job
