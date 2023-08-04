import { GenerateStreamsHandler } from '../../types'
import { GithubIntegrationSettings, GithubRootStream, GithubStreamType } from './types'

const handler: GenerateStreamsHandler = async (ctx) => {
  const settings = ctx.integration.settings as GithubIntegrationSettings
  const reposToCheck = [...(settings.repos || []), ...(settings.unavailableRepos || [])]

  const isManualRun = ctx.isManualRun

  if (isManualRun) {
    // starting process differently
    return
  }

  await ctx.publishStream<GithubRootStream>(GithubStreamType.ROOT, {
    reposToCheck,
  })
}

export default handler
