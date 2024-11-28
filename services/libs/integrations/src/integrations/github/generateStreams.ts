import { GenerateStreamsHandler } from '../../types'

import { GithubIntegrationSettings, GithubRootStream, GithubStreamType, Repo } from './types'

const NEW_REPO_THRESHOLD_MS = 20000 // 20 seconds in milliseconds

interface AdditionalInfo {
  messageSentAt: string
}

const isRepoRecentlyUpdated = (repo: Repo, messageSentAt?: Date): boolean => {
  if (!repo.updatedAt) return true // If no updatedAt, process it to be safe

  if (messageSentAt) {
    // For newly added repos, check if they were updated within 2 seconds of the message
    const repoUpdateTime = new Date(repo.updatedAt).getTime()
    const messageTime = messageSentAt.getTime()
    return Math.abs(repoUpdateTime - messageTime) < NEW_REPO_THRESHOLD_MS
  }

  return true
}

const handler: GenerateStreamsHandler = async (ctx) => {
  const messageSentAt = (ctx.additionalInfo as AdditionalInfo)?.messageSentAt
    ? new Date((ctx.additionalInfo as AdditionalInfo).messageSentAt)
    : undefined
  const settings = ctx.integration.settings as GithubIntegrationSettings
  const reposToCheck = ctx.onboarding
    ? settings.orgs
        .flatMap((org) => org.repos)
        .filter((repo) => isRepoRecentlyUpdated(repo, messageSentAt))
    : // for onboarding runs, we only check recently added repos. This needed when integration updated
      settings.orgs.flatMap((org) => org.repos) // for non-onboarding runs, we check all repos

  ctx.log.info(`${messageSentAt ? messageSentAt.toISOString() : 'Checking all repos'}`)

  await ctx.publishStream<GithubRootStream>(GithubStreamType.ROOT, {
    reposToCheck,
  })
}

export default handler
