import { IIntegrationDescriptor } from '../../../types'
import memberAttributes from './memberAttributes'
import generateStreams from './generateStreams'
import processStream from './processStream'
import processData from './processData'

const descriptor: IIntegrationDescriptor = {
  type: 'linkedin',
  memberAttributes,
  checkEvery: 60,
  generateStreams,
  processStream,
  processData,
}

export default descriptor
