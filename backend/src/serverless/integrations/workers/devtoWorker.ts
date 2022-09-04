import lodash from 'lodash'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import getUserContext from '../../../database/utils/getUserContext'
import { BaseOutput } from '../../microservices/nodejs/messageTypes'
import DevtoIterator from '../iterators/devtoIterator'
import { DevtoArticleSettings, DevtoIntegrationSettings } from '../types/devtoTypes'
import { DevtoOutput } from '../types/iteratorTypes'
import { DevtoIntegrationMessage } from '../types/messageTypes'
import { getAllOrganizationArticles } from '../usecases/devto/getOrganizationArticles'
import { getAllUserArticles } from '../usecases/devto/getUserArticles'
import { DevtoArticle } from '../usecases/devto/types'
import { singleOrDefault } from '../../../utils/arrays'
import MemberAttributeSettingsService from '../../../services/memberAttributeSettingsService'
import { DevtoMemberAttributes } from '../../../database/attributes/member/devto'
import { TwitterMemberAttributes } from '../../../database/attributes/member/twitter'
import { MemberAttributeName } from '../../../database/attributes/member/enums'
import { GithubMemberAttributes } from '../../../database/attributes/member/github'

/**
 * Devto worker that is responsible for consuming the devto integration messages
 * that were pushed to the message queue. Each message contains information about
 * a specific devto integration to check all comments from any organization/user article.
 *
 * To keep track of articles that were already checked, we save information about the
 * articles last comment in the integration settings. When we try to find articles that
 * need to be checked for new comments we consider what we already checked and what the
 * last comment date was back then.
 * @param body {DevtoIntegrationMessage}
 */
async function devtoWorker(body: DevtoIntegrationMessage) {
  try {
    console.log('Starting Devto worker with body, ', body)
    const { state, tenant, onboarding, integrationId } = body

    // Inject user and tenant to IRepositoryOptions
    const userContext = await getUserContext(tenant)

    const memberAttributesService = new MemberAttributeSettingsService(userContext)

    await memberAttributesService.createPredefined(DevtoMemberAttributes)

    await memberAttributesService.createPredefined(
      TwitterMemberAttributes.filter((a) => a.name === MemberAttributes.URL.name),
    )

    await memberAttributesService.createPredefined(
      GithubMemberAttributes.filter(
        (a) => a.name === MemberAttributes.NAME.name || a.name === MemberAttributes.URL.name,
      ),
    )

    const integration = await IntegrationRepository.findById(integrationId, userContext)

    if (integration.settings.updateMemberAttributes) {
      const memberAttributesService = new MemberAttributeSettingsService(userContext)

      await memberAttributesService.createPredefined(DevtoMemberAttributes)

      await memberAttributesService.createPredefined(
        MemberAttributeSettingsService.pickAttributes(
          [MemberAttributeName.URL],
          TwitterMemberAttributes,
        ),
      )

      await memberAttributesService.createPredefined(
        MemberAttributeSettingsService.pickAttributes(
          [MemberAttributeName.URL, MemberAttributeName.NAME],
          GithubMemberAttributes,
        ),
      )

      integration.settings.updateMemberAttributes = false

      await IntegrationRepository.update(
        integration.id,
        { settings: integration.settings },
        userContext,
      )
    }
    const settings: DevtoIntegrationSettings = integration.settings

    const articles = settings.articles ? settings.articles : []

    let articlesFromAPI: DevtoArticle[] = []
    if (settings.organizations.length > 0) {
      for (const organization of settings.organizations) {
        const articles = await getAllOrganizationArticles(organization)
        articlesFromAPI.push(...articles)
      }
    }

    if (settings.users.length > 0) {
      for (const user of settings.users) {
        const articles = await getAllUserArticles(user)
        articlesFromAPI.push(...articles)
      }
    }

    articlesFromAPI = lodash.uniqBy(articlesFromAPI, (a) => a.id)

    // Now lets find all articles that needs to be checked for fresh comments
    const articlesToCheck: DevtoArticle[] = []
    for (const article of articlesFromAPI) {
      const existingArticle = singleOrDefault(articles, (a) => a.id === article.id)
      let check = false
      if (existingArticle) {
        if (!existingArticle.lastCommentAt) {
          // we have an article that wasn't checked before
          check = true
        } else if (existingArticle.lastCommentAt !== article.last_comment_at) {
          // we have an article where last comment dates from our database does not match the date from
          // the API so this means that we have new comments
          check = true
        }
      } else {
        // we have a new article that hasn't been checked before
        check = true
      }

      if (check) {
        articlesToCheck.push(article)
      }
    }

    const successStatus: BaseOutput = DevtoIterator.success as BaseOutput
    if (articlesToCheck.length > 0) {
      const iterator = new DevtoIterator(
        tenant,
        articlesToCheck,
        userContext,
        integration.id,
        state,
        onboarding,
      )
      const iterationResult: DevtoOutput = await iterator.iterate()

      console.log('Devto worker iteration result, ', iterationResult)

      if (
        iterationResult.status === successStatus.status &&
        iterationResult.msg === successStatus.msg
      ) {
        console.log('Updating articles')

        const articles: DevtoArticleSettings[] = []
        // first set all the API articles since they are the currently published ones
        for (const article of articlesFromAPI) {
          articles.push({ id: article.id, lastCommentAt: article.last_comment_at })
        }

        // now merge in articles that were already in the settings but perhaps are now not published anymore
        // this is because if the article gets republished we don't know what we already checked if we don't keep this
        for (const oldArticle of settings.articles) {
          if (singleOrDefault(articles, (a) => a.id === oldArticle.id) === undefined) {
            articles.push(oldArticle)
          }
        }

        const newSettings: DevtoIntegrationSettings = {
          ...settings,
          articles,
        }

        await IntegrationRepository.update(
          integration.id,
          {
            settings: newSettings,
          },
          userContext,
        )
      }
    } else {
      console.log(`We have no Devto articles to process for tenant ${tenant}!`)
      await IntegrationRepository.update(integrationId, { status: 'done' }, userContext)
    }
  } catch (err) {
    console.log('Error in Devto worker, ', err)
    throw err
  }
}

export default devtoWorker
