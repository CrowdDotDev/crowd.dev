import axios from 'axios'

interface WebhookSetupResult {
  projectId: number
  hookId?: number
  success: boolean
  error?: string
}

const webhookBase = process.env.GITLAB_WEBHOOK_BASE_URL  || 'https://5821-202-58-201-160.ngrok-free.app'

const createWebhookUrl = (integrationId: string) => `${webhookBase}/gitlab/${integrationId}`

export async function setupGitlabWebhooks(accessToken: string, projectIds: number[], integrationId: string): Promise<WebhookSetupResult[]> {
  const results: WebhookSetupResult[] = []

  for (const projectId of projectIds) {
    try {
      const response = await axios.post(
        `https://gitlab.com/api/v4/projects/${projectId}/hooks`,
        {
          url: createWebhookUrl(integrationId),
          push_events: false,
          issues_events: true,
          confidential_issues_events: true,
          merge_requests_events: true,
          note_events: true, // This covers discussions
          job_events: false,
          pipeline_events: false,
          wiki_page_events: false,
          enable_ssl_verification: true,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      if (response.status === 201) {
        results.push({ projectId, success: true, hookId: response.data.id })
      } else {
        results.push({ projectId, success: false, error: `Unexpected response status: ${response.status}` })
      }
    } catch (error) {
      results.push({ projectId, success: false, error: error.message })
    }
  }

  return results
}
