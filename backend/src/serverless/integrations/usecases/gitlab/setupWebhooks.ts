import axios from 'axios'
import {timeout} from "@crowd/common"

interface WebhookSetupResult {
  projectId: number
  hookId?: number
  success: boolean
  error?: string
}

const webhookUrl = 'https://webhook-test.com/f7eff8ec48e6bb6a35d46e4861a47e16'

export async function setupGitlabWebhooks(accessToken: string, projectIds: number[]): Promise<WebhookSetupResult[]> {
  const results: WebhookSetupResult[] = []

  for (const projectId of projectIds) {
    try {
      const response = await axios.post(
        `https://gitlab.com/api/v4/projects/${projectId}/hooks`,
        {
          url: webhookUrl,
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

    await timeout(1000)
  }

  return results
}
