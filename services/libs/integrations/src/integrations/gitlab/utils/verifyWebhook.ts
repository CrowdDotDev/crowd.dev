import { IProcessWebhookStreamContext } from '../../../types'
import { GitlabPlatformSettings } from '../types'

const verifyGitlabWebhook = (
  ctx: IProcessWebhookStreamContext,
  headers: Record<string, string>,
) => {
  const incomingToken = headers['x-gitlab-token']
  const platformSettings = ctx.platformSettings as GitlabPlatformSettings
  const expectedToken = platformSettings.webhookToken
  if (incomingToken !== expectedToken) {
    ctx.log.error({ incomingToken, expectedToken }, 'Unauthorized webhook token')
    throw new Error('Unauthorized webhook token')
  }
}

export default verifyGitlabWebhook
