import { GenerateStreamsHandler } from '../../../types'
import {
  HubspotEntity,
  IHubspotAttributeMap,
  IHubspotBaseStream,
  IHubspotIntegrationSettings,
} from './types'

const handler: GenerateStreamsHandler = async (ctx) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  const settings = ctx.integration.settings as IHubspotIntegrationSettings

  if (!settings.enabledFor || settings.enabledFor.length === 0) {
    await ctx.abortRunWithError('Integration is not enabled for members or organizations!')
    return
  }

  if (settings.enabledFor.includes(HubspotEntity.MEMBERS)) {
    const fieldMap: IHubspotAttributeMap = settings.attributesMapping?.members

    if (!fieldMap) {
      await ctx.abortRunWithError(
        `Integration is enabled for members, but field mapping for members doesn't exist!`,
      )
      return
    }

    await ctx.publishStream<IHubspotBaseStream>(`${HubspotEntity.MEMBERS}`, {})
  }

  if (settings.enabledFor.includes(HubspotEntity.ORGANIZATIONS)) {
    const fieldMap: IHubspotAttributeMap = settings.attributesMapping?.organizations

    if (!fieldMap) {
      await ctx.abortRunWithError(
        `Integration is enabled for organizations, but field mapping for organizations doesn't exist!`,
      )
      return
    }

    await ctx.publishStream<IHubspotBaseStream>(`${HubspotEntity.ORGANIZATIONS}`, {})
  }
}

export default handler
