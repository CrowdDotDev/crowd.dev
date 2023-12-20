import { IIntegrationDescriptor } from '../../types'
import generateStreams from './generateStreams'
import { DISCORD_MEMBER_ATTRIBUTES } from './memberAttributes'
import processStream from './processStream'
import processData from './processData'
import { PlatformType } from '@crowd/types'
import processWebhookStream from './processWebhookStream'

const descriptor: IIntegrationDescriptor = {
  type: PlatformType.DISCORD,
  memberAttributes: DISCORD_MEMBER_ATTRIBUTES,
  checkEvery: 3 * 60, // 3 hours
  generateStreams,
  processStream,
  processData,
  processWebhookStream,
}

export default descriptor
