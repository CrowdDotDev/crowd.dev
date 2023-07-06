import { IIntegrationDescriptor } from '../../types'
import generateStreams from './generateStreams'
import { SLACK_MEMBER_ATTRIBUTES } from './memberAttributes'
import processStream from './processStream'
import processData from './processData'
import { PlatformType } from '@crowd/types'

const descriptor: IIntegrationDescriptor = {
  type: PlatformType.SLACK,
  memberAttributes: SLACK_MEMBER_ATTRIBUTES,
  checkEvery: 20,
  generateStreams,
  processStream,
  processData,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postProcess: (settings: any) => {
    const copy = { ...settings }
    copy.channels = settings.channels.map((ch) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { new: _, ...raw } = ch
      return raw
    })
    return copy
  },
}

export default descriptor
