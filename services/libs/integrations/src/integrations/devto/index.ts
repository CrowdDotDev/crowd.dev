import { IIntegrationDescriptor } from '../../types'
import generateStreams from './generateStreams'
import memberAttributes from './memberAttributes'
import processStream from './processStream'

const descriptor: IIntegrationDescriptor = {
  type: 'devto',
  memberAttributes,
  checkEvery: 20,

  generateStreams,
  processStream,
}

export default descriptor
