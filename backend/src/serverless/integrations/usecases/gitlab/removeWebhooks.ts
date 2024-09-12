import axios from 'axios'

interface WebhookRemovalResult {
  projectId: number
  success: boolean
  error?: string
}

export async function removeGitlabWebhooks(
  accessToken: string,
  projectIds: number[],
  hookIds: number[],
): Promise<WebhookRemovalResult[]> {
  const results: WebhookRemovalResult[] = []

  for (const projectId of projectIds) {
    for (const hookId of hookIds) {
      try {
        // Delete the webhook
        const deleteResponse = await axios.delete(
          `https://gitlab.com/api/v4/projects/${projectId}/hooks/${hookId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        )

        if (deleteResponse.status === 204) {
          results.push({ projectId, success: true })
        } else {
          results.push({
            projectId,
            success: false,
            error: `Unexpected response status: ${deleteResponse.status}`,
          })
        }
      } catch (error) {
        results.push({ projectId, success: false, error: error.message })
      }
    }
  }

  return results
}
