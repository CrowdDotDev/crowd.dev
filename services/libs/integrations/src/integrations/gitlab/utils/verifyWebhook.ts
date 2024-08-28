import { IProcessWebhookStreamContext } from '../../../types'
import { GitlabPlatformSettings } from '../types'

const verifyGitlabWebhook = (
  ctx: IProcessWebhookStreamContext,
  headers: Record<string, string>,
) => {
  const incomingToken = headers['x-gitlab-token']
  const platformSettings = ctx.integration.settings as GitlabPlatformSettings
  const expectedToken = platformSettings.webhookToken
  if (incomingToken !== expectedToken) {
    throw new Error('Unauthorized webhook token')
  }
}

export default verifyGitlabWebhook
