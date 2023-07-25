import { IIntegrationDescriptor } from '../../../types'
import generateStreams from './generateStreams'
import processStream from './processStream'
import processData from './processData'
import startSyncRemote from './startSyncRemote'
import processSyncRemote from './processSyncRemote'
import { HUBSPOT_MEMBER_ATTRIBUTES } from './memberAttributes'

const descriptor: IIntegrationDescriptor = {
  type: 'hubspot',
  memberAttributes: HUBSPOT_MEMBER_ATTRIBUTES,
  checkEvery: 8 * 60, // 8 hours
  generateStreams,
  processStream,
  processData,
  startSyncRemote,
  processSyncRemote,
}

export default descriptor
