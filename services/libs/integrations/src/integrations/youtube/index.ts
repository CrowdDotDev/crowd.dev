// index.ts content
import { IIntegrationDescriptor } from '../../types'
import generateStreams from './generateStreams'
import { YOUTUBE_MEMBER_ATTRIBUTES } from './memberAttributes'
import processStream from './processStream'
import processData from './processData'
import { PlatformType } from '@crowd/types'

const descriptor: IIntegrationDescriptor = {
  type: PlatformType.YOUTUBE,
  memberAttributes: YOUTUBE_MEMBER_ATTRIBUTES,
  checkEvery: 360,
  generateStreams,
  processStream,
  processData,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postProcess: (settings: any) => {
    return settings
  },
}

export default descriptor
