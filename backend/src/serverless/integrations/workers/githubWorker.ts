import getUserContext from '../../../database/utils/getUserContext'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import GithubIterator from '../iterators/githubIterator'
import { PlatformType } from '../../../utils/platforms'
import { IntegrationsMessage } from '../types/messageTypes'

async function githubWorker(body: IntegrationsMessage) {
  try {
    console.log('Starting GitHub worker with body, ', body)
    const { state, tenant, onboarding } = body

    const userContext = await getUserContext(tenant)

    const integration = await IntegrationRepository.findByPlatform(PlatformType.GITHUB, userContext)

    const githubIterator = new GithubIterator(
      tenant,
      integration.settings.repos,
      integration.token,
      state,
      onboarding,
    )

    return await githubIterator.iterate()
  } catch (err) {
    console.log('Error in github worker, ', err)
    throw err
  }
}

export default githubWorker
