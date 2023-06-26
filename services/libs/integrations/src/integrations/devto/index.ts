import { IIntegrationDescriptor } from '../../types'
import generateStreams from './generateStreams'
import { DEVTO_MEMBER_ATTRIBUTES } from './memberAttributes'
import processStream from './processStream'
import processData from './processData'
import { PlatformType } from '@crowd/types'

const descriptor: IIntegrationDescriptor = {
  type: PlatformType.DEVTO,
  memberAttributes: DEVTO_MEMBER_ATTRIBUTES,
  checkEvery: 20,

  generateStreams,
  processStream,
  processData,
}

export default descriptor
