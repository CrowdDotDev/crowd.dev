import moment from 'moment'
import { BaseOutput, TwitterOutput, TwitterReachOutput } from '../types/iteratorTypes'
import { TwitterIntegrationMessage, TwitterReachMessage } from '../types/messageTypes'
import TwitterIterator from '../iterators/twitterIterator'
import TwitterReachIterator from '../iterators/twitterReachIterator'
import getUserContext from '../../../database/utils/getUserContext'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import { PlatformType } from '../../../types/integrationEnums'
import MemberAttributeSettingsService from '../../../services/memberAttributeSettingsService'
import { TwitterMemberAttributes } from '../../../database/attributes/member/twitter'
import { TWITTER_CONFIG } from '../../../config'

const sdk = TwitterIterator.initSuperfaceClient()

async function refreshToken(userContext) {
  const integration = await IntegrationRepository.findByPlatform('twitter', userContext)

  const profile = await sdk.getProfile('oauth2/refresh-token')
  const profileWithNewTokens: any = (
    await profile.getUseCase('GetAccessTokenFromRefreshToken').perform({
      refreshToken: integration.refreshToken,
      clientId: TWITTER_CONFIG.clientId,
      clientSecret: TWITTER_CONFIG.clientSecret,
    })
  ).unwrap()

  const tweetCounterLastReset = integration.limitLastResetAt

  // Check tweet limit
  const timeSinceLastReset: number = moment()
    .utc()
    .diff(moment(tweetCounterLastReset).utc(), 'days')

  console.log('Time since last reset: ', timeSinceLastReset, ' days')

  // If the time since last reset is greater than the reset time, reset the counter
  if (timeSinceLastReset >= TWITTER_CONFIG.limitResetFrequencyDays) {
    integration.limitCount = 0
    integration.limitLastResetAt = moment().utc().toISOString()
  }

  console.log(
    `New refresh token for tenant [${userContext.currentTenant.id}] from api (before db write) [${profileWithNewTokens.refreshToken}]`,
  )

  // Update the refresh token
  const out = await IntegrationRepository.update(
    integration.id,
    {
      refreshToken: profileWithNewTokens.refreshToken,
      token: profileWithNewTokens.accessToken,
      limitCount: integration.limitCount,
    },
    userContext,
  )
  return out
}

/**
 * Twitter worker that is responsible for consuming the twitter integration messages
 * that were pushed to the message queue. Each message contains information about
 * a project's twitter integration.
 *
 * Since refresh tokens of twitter are just for one use, we generate a new one
 * using the superface sdk. This request also returns an access token to be forwarded
 * back to the actual iterator. New refresh token is saved back to the project
 * for future use.
 *
 * @param {TwitterIntegrationMessage}
 * @returns {TwitterOutput}
 */
async function twitterWorker(body: TwitterIntegrationMessage): Promise<TwitterOutput> {
  console.log('Starting Twitter worker with body, ', body)

  const { state, tenant, onboarding, args } = body
  const { profileId, hashtags } = args

  try {
    // Inject user and tenant to IRepositoryOptions
    const userContext = await getUserContext(tenant)

    const integrationUpdated = await refreshToken(userContext)

    const followersSet: Set<string> = new Set(integrationUpdated.settings.followers)

    const integration = await IntegrationRepository.findByPlatform(
      PlatformType.TWITTER,
      userContext,
    )

    if (integration.settings.updateMemberAttributes) {
      await new MemberAttributeSettingsService(userContext).createPredefined(
        TwitterMemberAttributes,
      )

      integration.settings.updateMemberAttributes = false

      await IntegrationRepository.update(
        integration.id,
        { settings: integration.settings },
        userContext,
      )
    }

    const twitterIterator = new TwitterIterator(
      tenant,
      profileId,
      integrationUpdated.token,
      hashtags,
      state,
      onboarding,
      integrationUpdated.limitCount,
      followersSet,
    )

    const iterationResult = await twitterIterator.iterate()

    const integrationAfterIterator = await IntegrationRepository.findByPlatform(
      PlatformType.TWITTER,
      userContext,
    )
    integrationAfterIterator.limitCount = iterationResult.tweetCount
    integrationAfterIterator.settings.followers = iterationResult.followers

    const successStatus: BaseOutput = TwitterIterator.success as BaseOutput
    if (
      onboarding &&
      iterationResult.status === successStatus.status &&
      iterationResult.msg === successStatus.msg
    ) {
      // When we are onboarding we reset the frequency to RESET_FREQUENCY_DAYS.in_hours - 6 hours.
      // This is because the tweets allowed during onboarding are free. Like this, the limit will reset 6h after the onboarding.
      const oldResetTime = moment()
        .utc()
        .subtract(TWITTER_CONFIG.limitResetFrequencyDays * 2, 'days')
        .format('YYYY-MM-DD HH:mm:ss')
      integrationAfterIterator.limitLastResetAt = oldResetTime
      console.log('It is onboarding, changing limit to something recent')
    }

    // Update the refresh token
    await IntegrationRepository.update(
      integrationAfterIterator.id,
      integrationAfterIterator,
      userContext,
    )
    return iterationResult
  } catch (err: any) {
    console.log('Error in twitter worker: ', err)
    throw err
  }
}

async function twitterReachWorker(body: TwitterReachMessage): Promise<TwitterReachOutput> {
  console.log('Starting Twitter Reach worker with body, ', body)

  const { state, tenant, args } = body
  const { profileId } = args

  try {
    // Inject user and tenant to IRepositoryOptions
    const userContext = await getUserContext(tenant)

    const members = TwitterReachIterator.wrapToEndpoints(
      await TwitterReachIterator.getMembers(userContext),
    )

    const integrationUpdated = await refreshToken(userContext)

    const twitterReachIterator = new TwitterReachIterator(
      tenant,
      profileId,
      integrationUpdated.token,
      members,
      state,
    )

    const iterationResult = await twitterReachIterator.iterate()
    return iterationResult
  } catch (err: any) {
    console.log('Error in twitter worker: ', err)
    throw err
  }
}

export { twitterWorker, twitterReachWorker }
