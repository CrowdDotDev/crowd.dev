import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import moment from 'moment'
import path from 'path'
import { getServiceLogger } from '@crowd/logging'
import { timeout } from '@crowd/common'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'
import RecurringEmailsHistoryRepository from '../../database/repositories/recurringEmailsHistoryRepository'
import { RecurringEmailType } from '../../types/recurringEmailsHistoryTypes'
import TenantService from '@/services/tenantService'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = getServiceLogger()

const options = [
  {
    name: 'tenant',
    alias: 't',
    type: String,
    description: 'The unique ID of tenant that you would like to send weekly emails to.',
  },
  {
    name: 'sendToAllTenants',
    alias: 'a',
    type: Boolean,
    defaultValue: false,
    description:
      'Set this flag to send the analytics e-mails to all tenants. Tenants that already got a weekly analytics e-mail for the previous week will be discarded.',
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

if (parameters.help || (!parameters.tenant && !parameters.sendToAllTenants)) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    let tenantIds

    if (parameters.sendToAllTenants) {
      tenantIds = (await TenantService._findAndCountAllForEveryUser({})).rows.map((t) => t.id)
    } else if (parameters.tenant) {
      tenantIds = parameters.tenant.split(',')
    } else {
      tenantIds = []
    }

    const weekOfYear = moment().utc().startOf('isoWeek').subtract(7, 'days').isoWeek().toString()
    const rehRepository = new RecurringEmailsHistoryRepository(options)

    for (const tenantId of tenantIds) {
      const tenant = await options.database.tenant.findByPk(tenantId)
      const isEmailAlreadySent =
        (await rehRepository.findByWeekOfYear(
          tenantId,
          weekOfYear,
          RecurringEmailType.WEEKLY_ANALYTICS,
        )) !== null

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
