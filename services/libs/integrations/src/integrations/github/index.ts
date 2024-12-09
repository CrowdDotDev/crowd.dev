// index.ts content
import { PlatformType } from '@crowd/types'

import { IIntegrationDescriptor } from '../../types'

import generateStreams from './generateStreams'
import { GITHUB_MEMBER_ATTRIBUTES } from './memberAttributes'
import processData from './processData'
import processStream from './processStream'
import processWebhookStream from './processWebhookStream'

const descriptor: IIntegrationDescriptor = {
  type: PlatformType.GITHUB,
  memberAttributes: GITHUB_MEMBER_ATTRIBUTES,
  checkEvery: 12 * 60, // 12 hours
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
