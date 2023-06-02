import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { getServiceLogger } from '@crowd/logging'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = getServiceLogger()

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
    name: 'trialEndsAt',
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
    content: 'Updates tenant plan.',
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
  console.log(usage)
  console.log(`Invalid plan ${parameters.plan}`)
} else {
  setImmediate(async () => {
    const plan = parameters.plan
    const isTrial = parameters.trialEndsAt !== null
    const trialEndsAt = parameters.trialEndsAt

    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const tenantIds = parameters.tenant.split(',')

    for (const tenantId of tenantIds) {
      const tenant = await options.database.tenant.findByPk(tenantId)

      if (!tenant) {
        log.error({ tenantId }, 'Tenant not found!')
        process.exit(1)
      } else {
        log.info({ tenantId, isTrial }, `Tenant found - updating tenant plan to ${plan}!`)
        await tenant.update({
          plan,
          isTrialPlan: isTrial,
          trialEndsAt,
        })
      }
    }

    process.exit(0)
  })
}
