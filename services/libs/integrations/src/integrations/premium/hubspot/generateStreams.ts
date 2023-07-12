import { GenerateStreamsHandler } from '../../../types'
import { HubspotEntity, IHubspotAttributeMap, IHubspotBaseStream } from './types'

const handler: GenerateStreamsHandler = async (ctx) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enabledFor: HubspotEntity[] = (ctx.integration.settings as any).enabledFor

  if (!enabledFor || enabledFor.length === 0) {
    await ctx.abortRunWithError('Integration is not enabled for members or organizations!')
    return
  }

  if (enabledFor.includes(HubspotEntity.MEMBERS)) {
    const fieldMap: IHubspotAttributeMap = (ctx.integration.settings as any).attributesMapping
      ?.members

    if (!fieldMap) {
      await ctx.abortRunWithError(
        'Integration is enabled for members, but field mapping is not existing!',
      )
      return
    }

    await ctx.publishStream<IHubspotBaseStream>(`${HubspotEntity.MEMBERS}`, {})
  }

  // TODO: add organizations as well
}

export default handler
