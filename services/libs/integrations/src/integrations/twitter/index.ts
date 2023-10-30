import { IIntegrationDescriptor } from '../../types'
import generateStreams from './generateStreams'
import { TWITTER_MEMBER_ATTRIBUTES } from './memberAttributes'
import processStream from './processStream'
import processData from './processData'
import { PlatformType } from '@crowd/types'

const descriptor: IIntegrationDescriptor = {
  type: PlatformType.TWITTER,
  memberAttributes: TWITTER_MEMBER_ATTRIBUTES,
  checkEvery: 30,
  generateStreams,
  processStream,
  processData,
}

export default descriptor
