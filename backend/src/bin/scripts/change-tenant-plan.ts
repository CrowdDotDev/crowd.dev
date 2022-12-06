import { PostHog } from 'posthog-node'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { createServiceLogger } from '../../utils/logging'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import setPosthogTenantProperties from '../../feature-flags/setTenantProperties'
import { POSTHOG_CONFIG } from '../../config'
import { timeout } from '../../utils/timing'

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = createServiceLogger()

const options = [
  {
    name: 'tenant',
    alias: 't',
    type: String,
    description: 'The unique ID of tenant that you would like to update.',
  },
  {
    name: 'plan',
    alias: 'p',
    type: String,
    description: `Plan that will be applied to the tenant. Accepted values are 'Growth' and 'Essential'.`,
  },
  {
    name: 'trial',
    alias: 'x',
    description:
      'YYYY-MM-dd format trial end date. If this value is ommited, isTrial will be set to false.',
    type: String,
    defaultValue: null,
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
]
const sections = [
  {
    content: banner,
    raw: true,
  },
  {
    header: 'Update tenant plan',
    content: 'Updates tenant plan and sends the data to posthog for feature flagging.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || !parameters.tenant || !parameters.plan) {
  console.log(usage)
} else if (parameters.plan !== 'Growth' && parameters.plan !== 'Essential') {
  console.log(parameters.plan)
} else {
  setImmediate(async () => {
    const tenantId = parameters.tenant
    const plan = parameters.plan
    const isTrial = parameters.trial !== null
    const trialEndsAt = parameters.trial

    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const tenant = await options.database.tenant.findByPk(tenantId)

    if (!tenant) {
      log.error({ tenantId }, 'Tenant not found!')
      process.exit(1)
    } else {
      log.info({ tenantId, isTrial }, `Tenant found - updating tenant plan to ${plan}!`)
      const updated = await tenant.update({
        plan,
        isTrialPlan: isTrial,
        trialEndsAt,
      })

      setPosthogTenantProperties(
        updated,
        new PostHog(POSTHOG_CONFIG.apiKey, { flushAt: 1, flushInterval: 1 }),
        options.database,
      )

      // give time to posthog to process queue messages
      await timeout(2000)
    }
    process.exit(0)
  })
}
