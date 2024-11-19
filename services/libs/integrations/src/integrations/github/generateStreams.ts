import { GenerateStreamsHandler } from '../../types'

import {
  GitHubManualIntegrationSettingsDetailedMap,
  GithubBasicStream,
  GithubIntegrationSettings,
  GithubManualIntegrationSettings,
  GithubManualStreamType,
  GithubRootStream,
  GithubStreamType,
  Repo,
} from './types'

const REPO_UPDATE_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes in milliseconds

const streamToManualStreamMap: Map<GithubStreamType, GithubManualStreamType> = new Map([
  [GithubStreamType.STARGAZERS, GithubManualStreamType.STARGAZERS],
  [GithubStreamType.FORKS, GithubManualStreamType.FORKS],
  [GithubStreamType.PULLS, GithubManualStreamType.PULLS],
  [GithubStreamType.ISSUES, GithubManualStreamType.ISSUES],
])

const manualStreamToStreamMap: Map<GithubManualStreamType, GithubStreamType> = new Map([
  [GithubManualStreamType.STARGAZERS, GithubStreamType.STARGAZERS],
  [GithubManualStreamType.FORKS, GithubStreamType.FORKS],
  [GithubManualStreamType.PULLS, GithubStreamType.PULLS],
  [GithubManualStreamType.ISSUES, GithubStreamType.ISSUES],
])

const objectToMap = (obj: object): Map<string, Array<GithubManualStreamType>> => {
  const map = new Map<string, Array<GithubManualStreamType>>()
  for (const [key, value] of Object.entries(obj)) {
    map.set(key, value)
  }
  return map
}

const isRepoRecentlyUpdated = (repo: Repo): boolean => {
  if (!repo.updatedAt) return true // If no updatedAt, process it to be safe
  const now = Date.now()
  const lastUpdate = new Date(repo.updatedAt).getTime()
  return now - lastUpdate < REPO_UPDATE_THRESHOLD_MS
}

const handler: GenerateStreamsHandler = async (ctx) => {
  const settings = ctx.integration.settings as GithubIntegrationSettings
  const reposToCheck = settings.orgs.flatMap((org) => org.repos).filter(isRepoRecentlyUpdated)
  const isManualRun = ctx.isManualRun

  if (isManualRun) {
    const manualSettings = ctx.manualSettings as GithubManualIntegrationSettings
    if (!manualSettings) {
      ctx.abortRunWithError('isManualRun is true but manualSettings is not set!')
    }

    if (manualSettings.orgs && manualSettings.manualSettingsType === 'default') {
      for (const org of manualSettings.orgs) {
        const recentRepos = org.repos.filter(isRepoRecentlyUpdated)
        for (const repo of recentRepos) {
          for (const endpoint of [
            GithubStreamType.STARGAZERS,
            GithubStreamType.FORKS,
            GithubStreamType.PULLS,
            GithubStreamType.ISSUES,
          ]) {
            if (
              manualSettings.streamType === GithubManualStreamType.ALL ||
              manualSettings.streamType === streamToManualStreamMap.get(endpoint)
            ) {
              await ctx.publishStream<GithubBasicStream>(`${endpoint}:${repo.name}:firstPage`, {
                repo,
                page: 1,
              })
            }
          }
        }
      }
    } else if (manualSettings.orgs && manualSettings.manualSettingsType === 'detailed_map') {
      const detailedSettings = manualSettings as GitHubManualIntegrationSettingsDetailedMap
      const map = objectToMap(detailedSettings.map)
      for (const [repoUrl, streams] of map) {
        for (const stream of streams) {
          const endpoint = manualStreamToStreamMap.get(stream)
          if (!endpoint) {
            ctx.abortRunWithError(`Invalid stream type: ${stream}`)
          }
          const repo = detailedSettings.orgs
            .flatMap((org) => org.repos)
            .find((r) => r.url === repoUrl)
          if (!repo) {
            ctx.abortRunWithError(`Could not find repo with URL: ${repoUrl}`)
          }
          if (isRepoRecentlyUpdated(repo)) {
            await ctx.publishStream<GithubBasicStream>(`${endpoint}:${repo.name}:firstPage`, {
              repo,
              page: 1,
            })
          }
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
