// generateStreams.ts content
import { GenerateStreamsHandler } from '../../types'
import {
  GithubPlatformSettings,
  GithubIntegrationSettings,
  GithubRootStream,
  GithubStreamType,
} from './types'

const handler: GenerateStreamsHandler = async (ctx) => {
  const settings = ctx.integration.settings as GithubIntegrationSettings
  const GITHUB_CONFIG = ctx.platformSettings as GithubPlatformSettings

  const IS_GITHUB_COMMIT_DATA_ENABLED = GITHUB_CONFIG.isCommitDataEnabled === 'true'
  const privateKey = GITHUB_CONFIG.privateKey
    ? Buffer.from(GITHUB_CONFIG.privateKey, 'base64').toString('ascii')
    : undefined

  const reposToCheck = [...(settings.repos || []), ...(settings.unavailableRepos || [])]

  await ctx.publishStream<GithubRootStream>(GithubStreamType.ROOT, {
    isCommitDataEnabled: IS_GITHUB_COMMIT_DATA_ENABLED,
    privateKey,
    reposToCheck,
  })
}

export default handler
