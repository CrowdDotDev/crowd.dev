export interface GithubWebhookTeam {
  name: string
  id: number
  node_id: string
  slug: string
  description: string
  privacy: string
  notification_setting: string
  url: string
  html_url: string
  members_url: string
  repositories_url: string
  permissions: string
  parent?: string
}
