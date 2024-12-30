import { IIntegrationDescriptor } from '../../types'

import generateStreams from './generateStreams'
import { HUBSPOT_MEMBER_ATTRIBUTES } from './memberAttributes'
import processData from './processData'
import processStream from './processStream'
import processSyncRemote from './processSyncRemote'
import startSyncRemote from './startSyncRemote'

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
