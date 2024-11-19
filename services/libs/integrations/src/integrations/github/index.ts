// index.ts content
import { PlatformType } from '@crowd/types'

import { IIntegrationDescriptor } from '../../types'

import generateStreams from './generateStreams'
import { GITHUB_MEMBER_ATTRIBUTES } from './memberAttributes'
import processData from './processData'
import processStream from './processStream'

const descriptor: IIntegrationDescriptor = {
  type: PlatformType.GITHUB,
  memberAttributes: GITHUB_MEMBER_ATTRIBUTES,
  checkEvery: 0.5 * 60,
  generateStreams,
  processStream,
  processData,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postProcess: (settings: any) => {
    return settings
  },
}

export default descriptor
