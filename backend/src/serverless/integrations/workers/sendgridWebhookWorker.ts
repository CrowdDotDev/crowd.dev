import { getServiceChildLogger } from '@crowd/logging'
import { EventWebhook, EventWebhookHeader } from '@sendgrid/eventwebhook'
import { PlatformType } from '@crowd/types'
import { IS_PROD_ENV, SENDGRID_CONFIG } from '../../../conf'
import SequelizeRepository from '../../../database/repositories/sequelizeRepository'
import UserRepository from '../../../database/repositories/userRepository'
import getUserContext from '../../../database/utils/getUserContext'
import EagleEyeContentService from '../../../services/eagleEyeContentService'
import { NodeWorkerMessageBase } from '../../../types/mq/nodeWorkerMessageBase'
import { SendgridWebhookEvent, SendgridWebhookEventType } from '../../../types/webhooks'
import { NodeWorkerMessageType } from '../../types/workerTypes'
import { sendNodeWorkerMessage } from '../../utils/nodeWorkerSQS'

const log = getServiceChildLogger('sendgridWebhookWorker')

export default async function sendgridWebhookWorker(req) {
  if (!SENDGRID_CONFIG.webhookSigningSecret) {
    log.error('Sendgrid webhook signing secret is not found.')
    return {
      status: 400,
    }
  }

  if (!IS_PROD_ENV) {
    log.warn('Sendgrid events will be only sent for production.')
    return {
      status: 200,
    }
  }

  const events = req.body as SendgridWebhookEvent[]

  const signature = req.headers[EventWebhookHeader.SIGNATURE().toLowerCase()]
  const timestamp = req.headers[EventWebhookHeader.TIMESTAMP().toLowerCase()]

  const eventWebhookVerifier = new EventWebhook()

  const ecdsaPublicKey = eventWebhookVerifier.convertPublicKeyToECDSA(
    SENDGRID_CONFIG.webhookSigningSecret,
  )

  if (!eventWebhookVerifier.verifySignature(ecdsaPublicKey, req.rawBody, signature, timestamp)) {
    log.error('Sendgrid webhook cannot be verified.')
    return {
      status: 400,
    }
  }

  for (const event of events) {
    if (event.sg_template_id === SENDGRID_CONFIG.templateEagleEyeDigest) {
      await sendNodeWorkerMessage(event.sg_event_id, {
        type: NodeWorkerMessageType.NODE_MICROSERVICE,
        event,
        service: 'sendgrid-webhooks',
      } as NodeWorkerMessageBase)
    }
  }

  return {
    status: 200,
  }
}

const findPlatform = (str: string, arr: string[]): string => {
  const match = arr.find((item) => str.includes(item))
  return match || null
}

export const processSendgridWebhook = async (message: any) => {
  log.info({ message }, 'Got event from sendgrid webhook!')
  log.warn(message)
  const options = await SequelizeRepository.getDefaultIRepositoryOptions()
  const sendgridEvent = message.event as SendgridWebhookEvent

  const user = await UserRepository.findByEmail(sendgridEvent.email, options)

  const userContext = await getUserContext(sendgridEvent.tenantId, user.id)

  switch (sendgridEvent.event) {
    case SendgridWebhookEventType.DIGEST_OPENED: {
      EagleEyeContentService.trackDigestEmailOpened(userContext)
      break
    }
    case SendgridWebhookEventType.POST_CLICKED: {
      const platform = findPlatform(
        new URL(sendgridEvent.url).hostname,
        Object.values(PlatformType),
      )
      EagleEyeContentService.trackPostClicked(sendgridEvent.url, platform, userContext, 'email')
      break
    }
    default:
      log.info({ event: message.event }, 'Unsupported event')
  }
}
