import { getServiceChildLogger } from '@crowd/logging'
import { EventWebhook, EventWebhookHeader } from '@sendgrid/eventwebhook'
import { IS_PROD_ENV, SENDGRID_CONFIG } from '../../conf'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'
import { SendgridWebhookEvent } from '../../types/webhooks'
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
