/**
 * This script is responsible for generating missing integration created
 * events in June
 */
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { getServiceLogger } from '@crowd/logging'
import TenantService from '../../services/tenantService'
import getUserContext from '../utils/getUserContext'
import IntegrationService from '../../services/integrationService'
import track from '../../segment/track'

const path = require('path')

const environmentArg = process.argv[2]

const envFile = environmentArg === 'dev' ? '.env' : `.env-${environmentArg}`

const env = dotenv.config({
  path: path.resolve(__dirname, `../../../${envFile}`),
})

dotenvExpand.expand(env)

const log = getServiceLogger()

async function juneIntegrationsInit() {
  const tenants = await TenantService._findAndCountAllForEveryUser({})

  // for each tenant
  for (const tenant of tenants.rows) {
    log.info(`processing tenant: ${tenant.id}`)
    const userContext = await getUserContext(tenant.id)

    const integrationService = new IntegrationService(userContext)
    const integrations = await integrationService.findAndCountAll({ filters: {} })
    for (const integration of integrations.rows) {
      track(
        'Integration Created',
        {
          id: integration.id,
          platform: integration.platform,
          status: integration.status,
        },
        userContext,
        false,
        integration.createdAt,
      )
    }
  }
}

juneIntegrationsInit()
