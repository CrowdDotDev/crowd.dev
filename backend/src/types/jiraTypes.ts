export interface JiraIntegrationData {
  id?: string // Integration ID for updates
  url: string
  username?: string
  personalAccessToken?: string
  apiToken?: string
  projects?: string[]
}
