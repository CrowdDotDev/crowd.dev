import { PlatformType } from '@crowd/types'
import TenantService from '../../../services/tenantService'
import getUserContext from '../../utils/getUserContext'
import ActivityService from '../../../services/activityService'
import SequelizeRepository from '../../repositories/sequelizeRepository'

export default async () => {
  const tenants = (await TenantService._findAndCountAllForEveryUser({ filter: {} })).rows

  for (const tenant of tenants) {
    const userContext = await getUserContext(tenant.id)
    const as = new ActivityService(userContext)

    const discordActivities = await as.findAndCountAll({
      filter: { platform: PlatformType.DISCORD, type: 'message' },
      orderBy: 'timestamp_ASC',
    })

    for (const discordActivity of discordActivities.rows) {
      if (discordActivity.parentId) {
        // get parent activity
        const parentAct = await as.findById(discordActivity.parentId)

        const transaction = await SequelizeRepository.createTransaction(userContext)

        await as.addToConversation(discordActivity.id, parentAct.id, transaction)

        await SequelizeRepository.commitTransaction(transaction)
      }
    }
  }
}
