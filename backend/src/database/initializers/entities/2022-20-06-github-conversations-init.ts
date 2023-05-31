import { GithubActivityType } from '@crowd/integrations'
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

    const githubActs = await as.findAndCountAll({
      filter: { platform: PlatformType.GITHUB },
      orderBy: 'timestamp_ASC',
    })

    githubActs.rows = githubActs.rows.filter(
      (i) =>
        i.type === GithubActivityType.PULL_REQUEST_COMMENT ||
        i.type === GithubActivityType.ISSUE_COMMENT,
    )

    for (const githubActivity of githubActs.rows) {
      if (githubActivity.parentId && githubActivity.conversationId === null) {
        // get parent activity
        const parentAct = await as.findById(githubActivity.parentId)

        const transaction = await SequelizeRepository.createTransaction(userContext)

        await as.addToConversation(githubActivity.id, parentAct.id, transaction)

        await SequelizeRepository.commitTransaction(transaction)
      }
    }
  }
}
