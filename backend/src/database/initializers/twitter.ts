/**
 * This script is responsible for generating non
 * existing parentIds for historical discord activities
 */

import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import TenantService from '../../services/tenantService'
import MemberService from '../../services/memberService'
import getUserContext from '../utils/getUserContext'

const path = require('path')

const env = dotenv.config({
  path: path.resolve(__dirname, `../../../.backend.env`),
})

dotenvExpand.expand(env)

async function discordSetParentForThreads() {
  const tenants = await TenantService._findAndCountAllForEveryUser({})

  // for each tenant
  for (const t of tenants.rows) {
    const tenantId = t.id
    // get user context
    const userContext = await getUserContext(tenantId)
    // get discord message activities
    const ms = new MemberService(userContext)
    const limit = 100
    const query = {
      advancedFilter: {
        and: [
          {
            identities: {
              contains: ['twitter'],
            },
          },
          {
            not: {
              identities: {
                contains: ['github'],
              },
            },
          },
        ],
      },
      limit,
    }
    const tRowsCount = await ms.findAndCountAll(query)
    const count = tRowsCount.count
    let offset = 0
    while (offset * limit < count) {
      const members = (await ms.findAndCountAll({ ...query, offset })).rows
      offset += limit
      for (const m of members) {
        console.log(m)
      }
    }
  }
}

discordSetParentForThreads()
