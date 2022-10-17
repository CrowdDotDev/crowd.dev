/**
 * This script is responsible for generating non
 * existing parentIds for historical discord activities
 */
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import TenantService from '../../services/tenantService'
import ActivityService from '../../services/activityService'
import getUserContext from '../utils/getUserContext'
import SequelizeRepository from '../repositories/sequelizeRepository'
import { PlatformType } from '../../utils/platforms'

const path = require('path')

const env = dotenv.config({
  path: path.resolve(__dirname, `../../../.env.prod`),
})

dotenvExpand.expand(env)

async function conversationInit() {
  const tenants = await TenantService._findAndCountAllForEveryUser({})

  // for each tenant
  for (const tenant of tenants.rows) {
    console.log('processing tenant: ', tenant.id)
    const userContext = await getUserContext(tenant.id)
    const as = new ActivityService(userContext)

    const discordActivities = await as.findAndCountAll({
      filter: { platform: PlatformType.DISCORD, type: 'message' },
      orderBy: 'timestamp_ASC',
    })

    for (const discordActivity of discordActivities.rows) {
      if (discordActivity.parentId) {
        console.log(
          `This activity ${discordActivity.id} has a parent id:  ${discordActivity.parentId}`,
        )
        // get parent activity
        const parentAct = await as.findById(discordActivity.parentId)

        const transaction = await SequelizeRepository.createTransaction(userContext)

        await as.addToConversation(discordActivity.id, parentAct.id, transaction)

        await SequelizeRepository.commitTransaction(transaction)
      }
    }
  }
}

conversationInit()
