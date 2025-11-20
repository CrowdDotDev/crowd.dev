export interface ConfluenceIntegrationData {
  id?: string // Integration ID for updates
  settings: {
    url: string
    spaces: string[]
    username: string
    apiToken: string // This will be encrypted when stored in the database
    orgAdminApiToken: string // Organization Admin API Token without scopes - required for user data access
    orgAdminId: string // Organization ID for admin authentication
  }
  segments?: string[]
}
