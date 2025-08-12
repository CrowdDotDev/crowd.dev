export interface ConfluenceIntegrationData {
  settings: {
    url: string
    spaces: string[]
    username: string
    apiToken: string // This will be encrypted when stored in the database
    orgAdminApiToken: string // Organization Admin API Token without scopes - required for user data access
  }
  segments?: string[]
} 