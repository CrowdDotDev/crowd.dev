import { PlatformType } from '@crowd/types'
import TenantService from '../../../services/tenantService'
import ActivityService from '../../../services/activityService'
import getUserContext from '../../utils/getUserContext'
import SequelizeRepository from '../../repositories/sequelizeRepository'

export default async () => {
  const tenants = await TenantService._findAndCountAllForEveryUser({})

  // for each tenant
  for (const tenant of tenants.rows) {
    const userContext = await getUserContext(tenant.id)
    const as = new ActivityService(userContext)

    const slackActs = await as.findAndCountAll({
      filter: { platform: PlatformType.SLACK, type: 'message' },
      orderBy: 'timestamp_ASC',
    })

    for (const slackActivity of slackActs.rows) {
      if (slackActivity.parentId && slackActivity.conversationId === null) {
        // get parent activity
        const parentAct = await as.findById(slackActivity.parentId)

        const transaction = await SequelizeRepository.createTransaction(userContext)

        await as.addToConversation(slackActivity.id, parentAct.id, transaction)

        await SequelizeRepository.commitTransaction(transaction)
      }
    }
  }
}
