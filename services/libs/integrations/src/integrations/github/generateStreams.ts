import { GenerateStreamsHandler } from '../../types'
import {
  GithubIntegrationSettings,
  GithubRootStream,
  GithubStreamType,
  GithubManualIntegrationSettings,
  GithubManualStreamType,
  GithubBasicStream,
} from './types'

const streamToManualStreamMap: Map<GithubStreamType, GithubManualStreamType> = new Map([
  [GithubStreamType.STARGAZERS, GithubManualStreamType.STARGAZERS],
  [GithubStreamType.FORKS, GithubManualStreamType.FORKS],
  [GithubStreamType.PULLS, GithubManualStreamType.PULLS],
  [GithubStreamType.ISSUES, GithubManualStreamType.ISSUES],
  [GithubStreamType.DISCUSSIONS, GithubManualStreamType.DISCUSSIONS],
])

const manualStreamToStreamMap: Map<GithubManualStreamType, GithubStreamType> = new Map([
  [GithubManualStreamType.STARGAZERS, GithubStreamType.STARGAZERS],
  [GithubManualStreamType.FORKS, GithubStreamType.FORKS],
  [GithubManualStreamType.PULLS, GithubStreamType.PULLS],
  [GithubManualStreamType.ISSUES, GithubStreamType.ISSUES],
  [GithubManualStreamType.DISCUSSIONS, GithubStreamType.DISCUSSIONS],
])

const handler: GenerateStreamsHandler = async (ctx) => {
  const settings = ctx.integration.settings as GithubIntegrationSettings
  const reposToCheck = [...(settings.repos || []), ...(settings.unavailableRepos || [])]

  const isManualRun = ctx.isManualRun

  if (isManualRun) {
    const manualSettings = ctx.manualSettings as GithubManualIntegrationSettings
    if (!manualSettings) {
      ctx.abortRunWithError('isManualRun is true but manualSettings is not set!')
    }

    if (manualSettings.repos && manualSettings.manualSettingsType === 'default') {
      for (const repo of manualSettings.repos) {
        for (const endpoint of [
          GithubStreamType.STARGAZERS,
          GithubStreamType.FORKS,
          GithubStreamType.PULLS,
          GithubStreamType.ISSUES,
          GithubStreamType.DISCUSSIONS,
        ]) {
          if (
            manualSettings.streamType === GithubManualStreamType.ALL ||
            manualSettings.streamType === streamToManualStreamMap.get(endpoint)
          ) {
            await ctx.publishStream<GithubBasicStream>(`${endpoint}:${repo.name}:firstPage`, {
              repo,
              page: '',
            })
          }
        }
      }
    } else if (manualSettings.repos && manualSettings.manualSettingsType === 'detailed_map') {
      for (const [repo, streams] of manualSettings.map) {
        for (const stream of streams) {
          const endpoint = manualStreamToStreamMap.get(stream)
          if (!endpoint) {
            ctx.abortRunWithError(`Invalid stream type: ${stream}`)
          }
          await ctx.publishStream<GithubBasicStream>(`${endpoint}:${repo.name}:firstPage`, {
            repo,
            page: '',
          })
        }
      }
    }

    return
  }

  // not manual run, executing normal run
  await ctx.publishStream<GithubRootStream>(GithubStreamType.ROOT, {
    reposToCheck,
  })
}

export default handler
