import { proxyActivities, sleep } from '@temporalio/workflow'

import * as activities from '../activities/nangoActivities'
import { ISyncGithubIntegrationArguments } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 hour',
})

export async function syncGithubIntegration(args: ISyncGithubIntegrationArguments): Promise<void> {
  const limit = await activity.numberOfGithubConnectionsToCreate()
  let created = 0

  for (const integrationId of args.integrationIds) {
    const result = await activity.analyzeGithubIntegration(integrationId)

    // delete connections that are no longer needed
    for (const repo of result.reposToDelete) {
      // delete nango connection
      await activity.deleteConnection(integrationId, result.providerConfigKey, repo.connectionId)

      // delete connection from integrations.settings.nangoMapping object
      await activity.removeGithubConnection(integrationId, repo.connectionId)

      // delete githubRepos mapping
      await activity.unmapGithubRepo(integrationId, repo.repo)
    }

    // delete duplicate connections
    for (const repo of result.duplicatesToDelete) {
      // delete nango connection
      await activity.deleteConnection(integrationId, result.providerConfigKey, repo.connectionId)

      // delete connection from integrations.settings.nangoMapping object
      await activity.removeGithubConnection(integrationId, repo.connectionId)

      // we don't unmap because this one was duplicated
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
        // random delay between 1-5 minutes to not overload nango server
        const jitterMs = 60000 + Math.random() * 240000
        await sleep(jitterMs)
      }
    }
  }
}
