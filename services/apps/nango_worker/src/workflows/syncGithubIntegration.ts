import { proxyActivities, sleep } from '@temporalio/workflow'

import * as activities from '../activities/nangoActivities'
import { ISyncGithubIntegrationArguments } from '../types'

const REPO_ONBOARDING_INTERVAL_MINUTES = 6

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 hour',
})

export async function syncGithubIntegration(args: ISyncGithubIntegrationArguments): Promise<void> {
  const limit = await activity.numberOfGithubConnectionsToCreate()
  let created = 0

  for (const integrationId of args.integrationIds) {
    const result = await activity.analyzeGithubIntegration(integrationId)

    // delete connections that are no longer needed
    for (const repo of result.reposToDelete) {
      await Promise.all([
        // delete nango connection
        activity.deleteConnection(integrationId, result.providerConfigKey, repo.connectionId),
        // delete connection from integrations.settings.nangoMapping object
        activity.removeGithubConnection(integrationId, repo.connectionId),
        // delete githubRepos mapping
        activity.unmapGithubRepo(integrationId, repo.repo),
      ])
    }

    // delete duplicate connections
    for (const repo of result.duplicatesToDelete) {
      await Promise.all([
        // delete nango connection
        activity.deleteConnection(integrationId, result.providerConfigKey, repo.connectionId),
        // delete connection from integrations.settings.nangoMapping object
        activity.removeGithubConnection(integrationId, repo.connectionId),
        // we don't unmap because this one was duplicated
      ])
    }

    // create connections for repos that are not already connected
    for (const repo of result.reposToSync) {
      if (created >= limit) {
        await activity.logInfo(
          `Max number of github connections reached! Skipping repo ${repo.owner}/${repo.repoName} from integration ${integrationId}!`,
        )
        continue
      }

      // create nango connection
      const connectionId = await activity.createGithubConnection(integrationId, repo)

      // add connection to integrations.settings.nangoMapping object
      await activity.setGithubConnection(integrationId, repo, connectionId)

      // add repo to githubRepos mapping if it's not already mapped
      await activity.mapGithubRepo(integrationId, repo)

      // add repo to git integration
      await activity.updateGitIntegrationWithRepo(integrationId, repo)

      // start nango sync
      await activity.startNangoSync(integrationId, result.providerConfigKey, connectionId)

      // sync repositories to segmentRepositories and insightsProjects after processing all repos
      await activity.syncGithubReposToInsights(integrationId)

      created++

      if (created < limit) {
        // fixed delay to spread onboarding evenly throughout the day
        await sleep(REPO_ONBOARDING_INTERVAL_MINUTES * 60 * 1000)
      }
    }
  }
}
