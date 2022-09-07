import getUserContext from '../../../database/utils/getUserContext'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import GithubIterator from '../iterators/githubIterator'
import { PlatformType } from '../../../utils/platforms'
import { IntegrationsMessage } from '../types/messageTypes'
import { GithubMemberAttributes } from '../../../database/attributes/member/github'
import { TwitterMemberAttributes } from '../../../database/attributes/member/twitter'
import { MemberAttributes } from '../../../database/attributes/member/enums'
import MemberAttributeSettingsService from '../../../services/memberAttributeSettingsService'

async function githubWorker(body: IntegrationsMessage) {
  try {
    console.log('Starting GitHub worker with body, ', body)
    const { state, tenant, onboarding } = body

    const userContext = await getUserContext(tenant)

    const integration = await IntegrationRepository.findByPlatform(PlatformType.GITHUB, userContext)

    if (integration.settings.updateMemberAttributes) {
      const memberAttributesService = new MemberAttributeSettingsService(userContext)

      // ensure memberAttribute settings for possible github member attributes
      await memberAttributesService.createPredefined(GithubMemberAttributes)

      // attribute.url may come from twitter
      await memberAttributesService.createPredefined(
        MemberAttributeSettingsService.pickAttributes(
          [MemberAttributes.URL.name],
          TwitterMemberAttributes,
        ),
      )

      integration.settings.updateMemberAttributes = false

      await IntegrationRepository.update(
        integration.id,
        { settings: integration.settings },
        userContext,
      )
    }

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
