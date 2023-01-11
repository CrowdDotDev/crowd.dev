import moment from 'moment'
import { PostHog } from 'posthog-node'
import { Stripe } from 'stripe'
import { POSTHOG_CONFIG, PLANS_CONFIG} from '../../../config'
import SequelizeRepository from '../../../database/repositories/sequelizeRepository'
import ensureFlagUpdated from '../../../feature-flags/ensureFlagUpdated'
import setPosthogTenantProperties from '../../../feature-flags/setTenantProperties'
import Plans from '../../../security/plans'
import { FeatureFlag } from '../../../types/common'
import { ApiWebsocketMessage } from '../../../types/mq/apiWebsocketMessage'
import { NodeWorkerMessageBase } from '../../../types/mq/nodeWorkerMessageBase'
import { createServiceChildLogger } from '../../../utils/logging'
import { createRedisClient } from '../../../utils/redis'
import RedisPubSubEmitter from '../../../utils/redis/pubSubEmitter'
import { NodeWorkerMessageType } from '../../types/workerTypes'
import { sendNodeWorkerMessage } from '../../utils/nodeWorkerSQS'

const log = createServiceChildLogger('stripeWebhookWorker')

const endpointSecret = PLANS_CONFIG.stripWebhookSigningSecret
const stripe = new Stripe(
  PLANS_CONFIG.stripeSecretKey,
  { apiVersion: '2022-08-01', typescript: true },
)

export default async function stripeWebhookWorker(req) {
  log.info('in stripe worker..')
  log.info(req.body)
  const sig = req.headers['stripe-signature']
  log.info('Logging sig from request: ')
  log.info(sig)
  let event
  log.info(req.headers)

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret)
    await sendNodeWorkerMessage(event.id, {
      type: NodeWorkerMessageType.NODE_MICROSERVICE,
      event,
      service: 'stripe-webhooks',
    } as NodeWorkerMessageBase)
  } catch (err) {
    log.error(`Webhook Error: ${err.message}`)
    return {
      status: 400,
    }
  }

  return {
    status: 200,
  }
}

export const processWebhook = async (message: any) => {
  log.info({ message }, 'Got event from stripe webhook!')
  log.warn(message)

  const options = await SequelizeRepository.getDefaultIRepositoryOptions()
  const redis = await createRedisClient(true)
  const posthog = new PostHog(POSTHOG_CONFIG.apiKey, { flushAt: 1, flushInterval: 1 })

  const apiPubSubEmitter = new RedisPubSubEmitter('api-pubsub', redis, (err) => {
    log.error({ err }, 'Error in api-ws emitter!')
  })
  const stripeWebhookMessage = message.event

  switch (stripeWebhookMessage.type) {
    case 'checkout.session.completed': {
      log.info(
        { tenant: stripeWebhookMessage.data.object.client_reference_id },
        'Processing checkout.session.complete',
      )

      // get subscription information from checkout event
      const subscription = await stripe.subscriptions.retrieve(
        stripeWebhookMessage.data.object.subscription,
      )

      const subscriptionEndsAt = subscription.current_period_end
      const tenantId = stripeWebhookMessage.data.object.client_reference_id

      const tenant = await options.database.tenant.findByPk(tenantId)

      if (!tenant) {
        log.error({ tenantId }, 'Tenant not found!')
        process.exit(1)
      } else {
        log.info({ tenantId }, `Tenant found - updating tenant plan to Growth plan!`)
        const updated = await tenant.update({
          plan: Plans.values.growth,
          isTrialPlan: false,
          trialEndsAt: null,
          stripeSubscriptionId: stripeWebhookMessage.data.object.subscription,
          planSubscriptionEndsAt: moment(subscriptionEndsAt, 'X').toISOString(),
        })

        setPosthogTenantProperties(updated, posthog, options.database, redis)

        // Ensure a growth specific flag is available before sending websocket message
        await ensureFlagUpdated(FeatureFlag.ORGANIZATIONS, tenantId, posthog, {
          plan: Plans.values.growth,
        })

        log.info('Emitting to redis pubsub for websocket forwarding from api..')
        // Send websocket message to frontend
        apiPubSubEmitter.emit(
          'user',
          new ApiWebsocketMessage(
            'tenant-plan-upgraded',
            JSON.stringify({ plan: Plans.values.growth, stripeSubscriptionId: stripeWebhookMessage.data.object.subscription}),
            undefined,
            tenantId,
          ),
        )
        log.info('Done!')

      }

      break
    }
    case 'invoice.payment_succeeded': {
      // Since we're already updating the plan on session.completed event,
      // we only need to process this event when billing_reason = `subscription_cycle` for the recurring payments.
      // When subscription is newly created, billing_reason is `subscription_create`
      log.info(stripeWebhookMessage.data.object.billing_reason, 'Invoice payment event')

      if (stripeWebhookMessage.data.object.billing_reason === 'subscription_cycle') {
        // find tenant by stripeSubscriptionId
        const tenant = await options.database.tenant.findOne({
          where: { stripeSubscriptionId: stripeWebhookMessage.data.object.subscription },
        })

        const subscription = await stripe.subscriptions.retrieve(
          stripeWebhookMessage.data.object.subscription,
        )

        await tenant.update({
          planSubscriptionEndsAt: moment(subscription.current_period_end, 'X').toISOString(),
        })
      }

      break
    }
    default:
      log.info({ event: message.event }, 'Unsupported event')
  }
}
