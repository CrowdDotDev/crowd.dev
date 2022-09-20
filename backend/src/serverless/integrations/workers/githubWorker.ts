import getUserContext from '../../../database/utils/getUserContext'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import GithubIterator from '../iterators/githubIterator'
import { PlatformType } from '../../../utils/platforms'
import { IntegrationsMessage } from '../types/messageTypes'
import StargazersQuery from '../usecases/github/graphql/stargazers'
import BaseIterator from '../iterators/baseIterator'
import { IRepositoryOptions } from '../../../database/repositories/IRepositoryOptions'
import { GithubMemberAttributes } from '../../../database/attributes/member/github'
import { TwitterMemberAttributes } from '../../../database/attributes/member/twitter'
import { MemberAttributeName } from '../../../database/attributes/member/enums'
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
          [MemberAttributeName.URL],
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

    if (integration.settings.repos.length > 0) {
      const githubIterator = new GithubIterator(
        tenant,
        await getAvailableRepos(integration, userContext),
        integration.token,
        state,
        onboarding,
      )

      return await githubIterator.iterate()
    }

    return BaseIterator.success
  } catch (err) {
    console.log('Error in github worker, ', err)
    throw err
  }
}

/**
 * Gets the repos available with given token.
 * Repositories can become unavailable if it's deleted after
 * making a github integration.
 * If a repo is not available, it will be removed from integration.settings
 * @param integration
 * @param userContext
 * @returns
 */
async function getAvailableRepos(integration, userContext: IRepositoryOptions) {
  const availableRepos = []
  let hasUnavailableRepos = false
  for (const repo of integration.settings.repos) {
    try {
      // we don't need to get default 100 item per page, just 1 is enough to check if repo is available
      const stargazersQuery = new StargazersQuery(repo, integration.token, 1)
      await stargazersQuery.getSinglePage('')
      availableRepos.push(repo)
    } catch (e) {
      console.log(`Repo ${repo.name} will not be parsed. It is not available with the github token`)
      hasUnavailableRepos = true
    }
  }

  integration.settings.repos = availableRepos

  if (hasUnavailableRepos) {
    await IntegrationRepository.update(
      integration.id,
      { settings: integration.settings },
      userContext,
    )
  }

  return availableRepos
}

export default githubWorker
