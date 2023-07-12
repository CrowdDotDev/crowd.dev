import { IIntegrationDescriptor } from '../../../types'
import generateStreams from './generateStreams'
import processStream from './processStream'
import processData from './processData'
import { HUBSPOT_MEMBER_ATTRIBUTES } from './memberAttributes'

const descriptor: IIntegrationDescriptor = {
  type: 'hubspot',
  memberAttributes: HUBSPOT_MEMBER_ATTRIBUTES,
  checkEvery: 60,
  generateStreams,
  processStream,
  processData,
}

export default descriptor
