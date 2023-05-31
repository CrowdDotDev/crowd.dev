import lodash from 'lodash'
import { PLANS_CONFIG } from '../../../conf'
import Plans from '../../../security/plans'
import TenantService from '../../../services/tenantService'

export default async (req, res) => {
  const stripe = require('stripe')(PLANS_CONFIG.stripeSecretKey)

  const event = stripe.webhooks.constructEvent(
    req.rawBody,
    req.headers['stripe-signature'],
    PLANS_CONFIG.stripWebhookSigningSecret,
  )

  if (event.type === 'checkout.session.completed') {
    let data = event.data.object
    data = await stripe.checkout.sessions.retrieve(data.id, { expand: ['line_items'] })

    const stripePriceId = lodash.get(data, 'line_items.data[0].price.id')

    if (!stripePriceId) {
      throw new Error('line_items.data[0].price.id NULL!')
    }

    const plan = Plans.selectPlanByStripePriceId(stripePriceId)
    const planStripeCustomerId = data.customer

    await new TenantService(req).updatePlanStatus(planStripeCustomerId, plan, 'active')
  }

  if (event.type === 'customer.subscription.updated') {
    const data = event.data.object

    const stripePriceId = lodash.get(data, 'items.data[0].price.id')
    const plan = Plans.selectPlanByStripePriceId(stripePriceId)
    const planStripeCustomerId = data.customer

    if (Plans.selectPlanStatus(data) === 'canceled') {
      await new TenantService(req).updatePlanToFree(planStripeCustomerId)
    } else {
      await new TenantService(req).updatePlanStatus(
        planStripeCustomerId,
        plan,
        Plans.selectPlanStatus(data),
      )
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const data = event.data.object

    const planStripeCustomerId = data.customer

    await new TenantService(req).updatePlanToFree(planStripeCustomerId)
  }

  await req.responseHandler.success(req, res, {
    received: true,
  })
}
