import getUserContext from '../../../database/utils/getUserContext'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import SettingsService from '../../../services/settingsService'
import GithubIterator from '../iterators/githubIterator'
import { PlatformType } from '../../../utils/platforms'
import { IntegrationsMessage } from '../types/messageTypes'
import { GithubMemberAttributes } from '../../../database/attributes/member/github'
import { TwitterMemberAttributes } from '../../../database/attributes/member/twitter'
import { MemberAttributes } from '../../../database/attributes/member/enums'

async function githubWorker(body: IntegrationsMessage) {
  try {
    console.log('Starting GitHub worker with body, ', body)
    const { state, tenant, onboarding } = body

    const userContext = await getUserContext(tenant)

    const integration = await IntegrationRepository.findByPlatform(PlatformType.GITHUB, userContext)

    // ensure memberAttribute settings for possible github member attributes
    await SettingsService.addMemberAttributesBulk(GithubMemberAttributes, userContext)

    // attribute.url may come from twitter
    await SettingsService.addMemberAttributesBulk(
      TwitterMemberAttributes.filter((i) => i.name === MemberAttributes.URL.name),
      userContext,
    )

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
