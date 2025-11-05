export interface IProcessNangoWebhookArguments {
  connectionId: string
  providerConfigKey: string
  model: string
  syncType: 'INITIAL' | 'INCREMENTAL'
  nextPageCursor?: string
}

export interface ISyncGithubIntegrationArguments {
  integrationIds: string[]
}

export interface IGithubIntegrationSyncInstructions {
  providerConfigKey: string

  reposToDelete: {
    repo: IGithubRepoData
    connectionId: string
  }[]
  duplicatesToDelete: {
    repo: IGithubRepoData
    connectionId: string
  }[]
  reposToSync: IGithubRepoData[]
}

export interface IGithubRepoData {
  owner: string
  repoName: string
}
