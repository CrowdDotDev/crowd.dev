import { IIntegrationDescriptor } from '../../types'
import generateStreams from './generateStreams'
import memberAttributes from './memberAttributes'
import processStream from './processStream'
import processData from './processData'
import { PlatformType } from '@crowd/types'

const descriptor: IIntegrationDescriptor = {
  type: PlatformType.STACKOVERFLOW,
  memberAttributes,
  checkEvery: 60,
  generateStreams,
  processStream,
  processData,
}

export default descriptor
