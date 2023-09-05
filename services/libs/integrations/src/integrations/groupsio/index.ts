// index.ts content
import { IIntegrationDescriptor } from '../../types'
import generateStreams from './generateStreams'
import { GROUPSIO_MEMBER_ATTRIBUTES } from './memberAttributes'
import processStream from './processStream'
import processData from './processData'
import processWebhookStream from './processWebhookStream'
import { PlatformType } from '@crowd/types'

const descriptor: IIntegrationDescriptor = {
  type: PlatformType.GROUPSIO,
  memberAttributes: GROUPSIO_MEMBER_ATTRIBUTES,
  generateStreams,
  processStream,
  processData,
  processWebhookStream,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postProcess: (settings: any) => {
    return settings
  },
}

export default descriptor
