import { IIntegrationDescriptor } from '../../types'
import generateStreams from './generateStreams'
import memberAttributes from './memberAttributes'
import processStream from './processStream'
import processData from './processData'
import { PlatformType } from '@crowd/types'

const descriptor: IIntegrationDescriptor = {
  type: PlatformType.HACKERNEWS,
  memberAttributes,
  checkEvery: 2 * 60,
  generateStreams,
  processStream,
  processData,
}

export default descriptor
