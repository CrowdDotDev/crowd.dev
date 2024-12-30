import axios from 'axios'

import { API_CONFIG, GITLAB_CONFIG } from '@/conf'

interface WebhookSetupResult {
  projectId: number
  hookId?: number
  success: boolean
  error?: string
}

const webhookBase = `${API_CONFIG.url}/webhooks`

const createWebhookUrl = (integrationId: string) => `${webhookBase}/gitlab/${integrationId}`

export async function setupGitlabWebhooks(
  accessToken: string,
  projectIds: number[],
  integrationId: string,
): Promise<WebhookSetupResult[]> {
  const results: WebhookSetupResult[] = []

  if (!GITLAB_CONFIG.webhookToken) {
    throw new Error('Gitlab webhook token is not set')
  }

  for (const projectId of projectIds) {
    try {
      const response = await axios.post(
        `https://gitlab.com/api/v4/projects/${projectId}/hooks`,
        {
          token: GITLAB_CONFIG.webhookToken,
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
        },
      )

      if (response.status === 201) {
        results.push({ projectId, success: true, hookId: response.data.id })
      } else {
        results.push({
          projectId,
          success: false,
          error: `Unexpected response status: ${response.status}`,
        })
      }
    } catch (error) {
      results.push({ projectId, success: false, error: error.message })
    }
  }

  return results
}
