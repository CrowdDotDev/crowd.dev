import { createServiceChildLogger, Logger } from '../../../utils/logging'

const log = createServiceChildLogger('githubWebhookWorker')

const endpointSecret = "whsec_Q3Bz7Be6uFgCNMiqFmCKcElEcfYcLqLm"
const stripe = require('stripe')

export default async function stripeWebhookWorker(req) {
  log.info("in stripe worker..")
  log.info(req.body)
  const sig = req.headers['stripe-signature']
  log.info("Logging sig from request: ")
  log.info(sig)
  let event
  log.info(req.headers)

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret)
  } catch (err) {
    log.error(`Webhook Error: ${err.message}`)
    return {
      status: 400
    }
  }

  log.info({ event }, 'Event parsed!')
  return {
    status: 200,
  }
}

export const processWebhook = async (
  msg: NodeWorkerProcessWebhookMessage,
  messageLogger: Logger,
) => {
  console.log("processing webhook")
}
