import { IIntegrationDescriptor } from '../../../types'
import { LINKEDIN_MEMBER_ATTRIBUTES } from './memberAttributes'
import generateStreams from './generateStreams'
import processStream from './processStream'
import processData from './processData'

const descriptor: IIntegrationDescriptor = {
  type: 'linkedin',
  memberAttributes: LINKEDIN_MEMBER_ATTRIBUTES,
  checkEvery: 60,
  generateStreams,
  processStream,
  processData,
}

export default descriptor
