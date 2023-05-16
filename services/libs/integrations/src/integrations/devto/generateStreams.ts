import { GenerateStreamsHandler } from '../../types'
import { DevToRootStream, IDevToIntegrationSettings } from './types'

const handler: GenerateStreamsHandler = async (ctx) => {
  const settings = ctx.integration.settings as IDevToIntegrationSettings

  if (settings.organizations.length === 0 && settings.users.length === 0) {
    await ctx.abortWithError('No organizations or users configured!')
    return
  }

  if (settings.organizations.length > 0) {
    await ctx.publishStream(DevToRootStream.ORGANIZATION_ARTICLES)
  }
  if (settings.users.length > 0) {
    await ctx.publishStream(DevToRootStream.USER_ARTICLES)
  }
}

export default handler
