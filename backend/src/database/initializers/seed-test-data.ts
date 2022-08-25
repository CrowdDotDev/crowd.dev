/**
 * This script is responsible for seeding
 * data to the database for pytest. It will be ran in
 * db-sync-migrations github actions after running the migrations
 * so that our latest image can be manipulated to have
 * testable data
 */

import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import TenantService from '../../services/tenantService'
import MicroserviceService from '../../services/microserviceService'

import getUserContext from '../utils/getUserContext'

const path = require('path')

const env = dotenv.config({
  path: path.resolve(__dirname, `../../../.env`),
})

dotenvExpand.expand(env)

async function updateCheckMergeMicroserviceInit() {
  const tenants = await TenantService._findAndCountAllForEveryUser({})

  for (const tenant of tenants.rows) {
    const userContext = await getUserContext(tenant.id)

    const ms = new MicroserviceService(userContext)

    const checkMergeMicroservice = await ms.findAndCountAll({ filter: { type: 'check_merge' } })

    // update checkMerge.init = false
    if (checkMergeMicroservice.count > 0) {
      await ms.update(checkMergeMicroservice.rows[0].id, { init: false })
    }
  }

  console.log(`checkMerge.init set to false for all tenants!`)
}

if (process.env.NODE_ENV !== 'local') {
  throw new Error('This script is only allowed for development environment!')
}

updateCheckMergeMicroserviceInit()
