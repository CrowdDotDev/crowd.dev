import { IIntegrationDescriptor } from '../../types'
import generateStreams from './generateStreams'
import { REDDIT_MEMBER_ATTRIBUTES } from './memberAttributes'
import processStream from './processStream'
import processData from './processData'
import { PlatformType } from '@crowd/types'

const descriptor: IIntegrationDescriptor = {
  type: PlatformType.REDDIT,
  memberAttributes: REDDIT_MEMBER_ATTRIBUTES,
  checkEvery: 60,
  generateStreams,
  processStream,
  processData,
}

export default descriptor
