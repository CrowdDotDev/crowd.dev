import { IIntegrationDescriptor } from '../../types'
import generateStreams from './generateStreams'
import { DEVTO_MEMBER_ATTRIBUTES } from './memberAttributes'
import processStream from './processStream'
import processData from './processData'
import { PlatformType } from '@crowd/types'

const descriptor: IIntegrationDescriptor = {
  type: PlatformType.DEVTO,
  memberAttributes: DEVTO_MEMBER_ATTRIBUTES,
  checkEvery: 3 * 60,

  generateStreams,
  processStream,
  processData,
  processWebhookStream: async (ctx) => {
    console.log('webhook stream data', ctx.stream.type, ctx.stream.identifier, ctx.stream.data)
  },
}

export default descriptor
