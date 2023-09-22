import { GenerateStreamsHandler } from '../../../types'
import {
  HubspotEntity,
  HubspotStream,
  IHubspotAttributeMap,
  IHubspotIntegrationSettings,
} from './types'

const handler: GenerateStreamsHandler = async (ctx) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  const settings = ctx.integration.settings as IHubspotIntegrationSettings

  if (!settings.enabledFor || settings.enabledFor.length === 0) {
    await ctx.abortRunWithError('Integration is not enabled for members or organizations!')
    return
  }

  const streams: HubspotStream[] = []

  if (settings.enabledFor.includes(HubspotEntity.MEMBERS)) {
    const fieldMap: IHubspotAttributeMap = settings.attributesMapping?.members

    if (!fieldMap) {
      await ctx.abortRunWithError(
        `Integration is enabled for members, but field mapping for members doesn't exist!`,
      )
      return
    }

    if (!settings.crowdAttributes) {
      await ctx.abortRunWithError(
        `Member attributes that are mapped to a hubspot field are required for member field mapper.`,
      )
      return
    }

    if (!settings.platforms) {
      await ctx.abortRunWithError(
        `Identity platforms that are mapped to a hubspot field are required for member field mapper.`,
      )
      return
    }

    streams.push(HubspotStream.MEMBERS)
  }

  if (settings.enabledFor.includes(HubspotEntity.ORGANIZATIONS)) {
    const fieldMap: IHubspotAttributeMap = settings.attributesMapping?.organizations

    if (!fieldMap) {
      await ctx.abortRunWithError(
        `Integration is enabled for organizations, but field mapping for organizations doesn't exist!`,
      )
      return
    }

    streams.push(HubspotStream.ORGANIZATIONS)
  }

  if (streams.length > 0) {
    await ctx.publishStream<HubspotStream[]>(HubspotStream.ROOT, streams)
  }
}

export default handler
