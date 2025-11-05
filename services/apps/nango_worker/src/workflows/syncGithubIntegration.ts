import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/nangoActivities'
import { ISyncGithubIntegrationArguments } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
})

export async function syncGithubIntegration(args: ISyncGithubIntegrationArguments): Promise<void> {
  const limit = await activity.numberOfGithubConnectionsToCreate()
  let created = 0

  for (const integrationId of args.integrationIds) {
    const result = await activity.analyzeGithubIntegration(integrationId)

    // delete connections that are no longer needed
    for (const repo of result.reposToDelete) {
      // delete nango connection
      await activity.deleteConnection(result.providerConfigKey, repo.connectionId)

      // delete connection from integrations.settings.nangoMapping object
      await activity.removeGithubConnection(integrationId, repo.connectionId)

      // delete githubRepos mapping
      await activity.unmapGithubRepo(integrationId, repo.repo)
    }

    // delete duplicate connections
    for (const repo of result.duplicatesToDelete) {
      // delete nango connection
      await activity.deleteConnection(result.providerConfigKey, repo.connectionId)

      // delete connection from integrations.settings.nangoMapping object
      await activity.removeGithubConnection(integrationId, repo.connectionId)

      // we don't unmap because this one was duplicated
    }

    // create connections for repos that are not already connected
    for (const repo of result.reposToSync) {
      if (created >= limit) {
        break
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
      await activity.startNangoSync(result.providerConfigKey, connectionId)

      created++
    }
  }
}
