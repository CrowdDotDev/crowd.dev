import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import moment from 'moment'
import path from 'path'
import { createServiceLogger } from '../../utils/logging'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { timeout } from '../../utils/timing'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'
import WeeklyAnalyticsEmailsHistoryRepository from '../../database/repositories/weeklyAnalyticsEmailsHistoryRepository'

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = createServiceLogger()

const options = [
  {
    name: 'tenant',
    alias: 't',
    type: String,
    description: 'The unique ID of tenant that you would like to send weekly emails to.',
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
    header: 'Send weekly analytics email to given tenant.',
    content:
      'Sends weekly analytics email to given tenant. The daterange will be from previous week.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || !parameters.tenant) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const tenantIds = parameters.tenant.split(',')
    const weekOfYear = moment().utc().startOf('isoWeek').subtract(7, 'days').isoWeek().toString()
    const waeRepository = new WeeklyAnalyticsEmailsHistoryRepository(options)

    for (const tenantId of tenantIds) {
      const tenant = await options.database.tenant.findByPk(tenantId)
      const isEmailAlreadySent =
        (await waeRepository.findByWeekOfYear(tenantId, weekOfYear)) !== null

      if (!tenant) {
        log.error({ tenantId }, 'Tenant not found! Skipping.')
      } else if (isEmailAlreadySent) {
        log.info(
          { tenantId },
          'Analytics email for this week is already sent to this tenant. Skipping.',
        )
      } else {
        log.info({ tenantId }, `Tenant found - sending weekly email message!`)
        await sendNodeWorkerMessage(tenant.id, {
          type: NodeWorkerMessageType.NODE_MICROSERVICE,
          tenant: tenant.id,
          service: 'weekly-analytics-emails',
        } as NodeWorkerMessageBase)

        if (tenantIds.length > 1) {
          await timeout(1000)
        }
      }
    }

    process.exit(0)
  })
}
