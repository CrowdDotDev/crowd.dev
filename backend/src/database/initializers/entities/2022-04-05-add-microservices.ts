import { PlatformType } from '@crowd/types'
import TenantService from '../../../services/tenantService'
import MicroserviceService from '../../../services/microserviceService'
import WidgetService from '../../../services/widgetService'
import IntegrationService from '../../../services/integrationService'
import getUserContext from '../../utils/getUserContext'
import * as microserviceTypes from '../../utils/keys/microserviceTypes'

export default async () => {
  const tenants = (await TenantService._findAndCountAllForEveryUser({ filter: {} })).rows

  for (const tenant of tenants) {
    const userContext = await getUserContext(tenant.id)
    const ms = new MicroserviceService(userContext)
    const ws = new WidgetService(userContext)
    const is = new IntegrationService(userContext)

    // add members_score microservice
    const membersScoreMicroservice = {
      init: true,
      type: microserviceTypes.membersScore,
    }

    await ms.create(membersScoreMicroservice)

    // if tenant has a benchmark widget set
    // add github_lookalike microservice to the tenant
    const benchmarkWidget = await ws.findAndCountAll({ filter: { type: 'benchmark' } })

    if (benchmarkWidget.count > 0) {
      const githubLookalikeMicroservice = {
        init: true,
        type: microserviceTypes.githubLookalike,
      }
      await ms.create(githubLookalikeMicroservice)
    }

    // if tenant has an active twitter integration set
    // add twitter_followers microservice to the tenant
    const twitterIntegration = await is.findAndCountAll({
      filter: { platform: PlatformType.TWITTER, status: 'done' },
    })

    if (twitterIntegration.count > 0) {
      const twitterFollowersMicroservice = {
        init: true,
        type: microserviceTypes.twitterFollowers,
      }
      await ms.create(twitterFollowersMicroservice)
    }
  }
}
