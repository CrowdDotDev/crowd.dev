import { BaseOutput, SlackOutput } from '../types/iteratorTypes'
import { Channels } from '../types/regularTypes'
import { SlackIntegrationMessage } from '../types/messageTypes'
import SlackIterator from '../iterators/slackIterator'
import getChannels from '../usecases/chat/getChannels'
import getUserContext from '../../../database/utils/getUserContext'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import { PlatformType } from '../../../utils/platforms'
import MemberAttributeSettingsService from '../../../services/memberAttributeSettingsService'
import { SlackMemberAttributes } from '../../../database/attributes/member/slack'

/**
 * Slack worker that is responsible for consuming the slack integration messages
 * that were pushed to the message queue. Each message contains information about
 * a project's slack integration.
 *
 * To keep track of newly created channels, we save the channels that are already onboarded
 * in project.integrations.slack.channels. When there is a new channel by cross-checking
 * with this list we can tell the iterator which channels are new so history should be
 * parsed for those channels as well.
 *
 * If the iterator returns a success message project.integrations.slack.channels is updated.
 *
 * @param body {SlackIntegrationMessage}
 * @returns {SlackOutput}
 */

async function slackWorker(body: SlackIntegrationMessage) {
  try {
    console.log('Starting Slack worker with body, ', body)
    const { state, tenant, onboarding } = body

    // Initialising the superface client here and passing it to the iterator
    // since we need it to get the channels from the slack api.
    // TODO: the future we can get channels in the iterator.
    const superfaceClient = SlackIterator.initSuperfaceClient()

    // Inject user and tenant to IRepositoryOptions
    const userContext = await getUserContext(tenant)

    await new MemberAttributeSettingsService(userContext).createPredefined(SlackMemberAttributes)

    // We already have the tenant filter in userContext
    // because of getCurrentTenant function in the repo layer.
    // Therefore we can feed an empty query object as first arg
    const integration = await IntegrationRepository.findByPlatform(PlatformType.SLACK, userContext)

    if (integration.settings.updateMemberAttributes) {
      await new MemberAttributeSettingsService(userContext).createPredefined(SlackMemberAttributes)

      integration.settings.updateMemberAttributes = false

      await IntegrationRepository.update(
        integration.id,
        { settings: integration.settings },
        userContext,
      )
    }

    // This will get all channels that we have acceess to (private or public)
    let channelsFromSlackAPI: Channels = await getChannels(
      superfaceClient,
      PlatformType.SLACK,
      { types: ['public'] },
      integration.token,
    )

    const channels = integration.settings.channels ? integration.settings.channels : []

    // Add bool new property to new channels
    channelsFromSlackAPI = channelsFromSlackAPI.map((c) => {
      if (channels.filter((a) => a.id === c.id).length <= 0) {
        return { ...c, new: true }
      }
      return c
    })

    console.log('Channels from Slack API, ', channelsFromSlackAPI)

    const members = integration.settings.members ? integration.settings.members : {}
    const slackIterator = new SlackIterator(
      superfaceClient,
      tenant,
      integration.token,
      channelsFromSlackAPI,
      members,
      integration.id,
      userContext,
      state,
      onboarding,
    )
    const iterationResult: SlackOutput = await slackIterator.iterate()

    const successStatus: BaseOutput = SlackIterator.success as BaseOutput
    console.log('Slack worker iteration result, ', iterationResult)

    // If iteration is returns a finsihed state, update the project's integration channels
    // channels should be in the JSONB field
    if (
      iterationResult.status === successStatus.status &&
      iterationResult.msg === successStatus.msg
    ) {
      console.log('Updating channels')

      const integration = await IntegrationRepository.findByPlatform(
        PlatformType.SLACK,
        userContext,
      )
      // Strip the new property from channels
      const channelsRaw = channelsFromSlackAPI.map((ch) => {
        const { new: _, ...raw } = ch
        return raw
      })

      integration.settings.channels = channelsRaw
      await IntegrationRepository.update(
        integration.id,
        {
          settings: integration.settings,
        },
        userContext,
      )
    }

    return iterationResult
  } catch (err) {
    console.log('Error in slack worker, ', err)
    throw err
  }
}

export default slackWorker
