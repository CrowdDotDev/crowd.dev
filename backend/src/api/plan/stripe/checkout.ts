import { PLANS_CONFIG } from '../../../conf'
import Error400 from '../../../errors/Error400'
import Error403 from '../../../errors/Error403'
import Plans from '../../../security/plans'
import TenantService from '../../../services/tenantService'
import { tenantSubdomain } from '../../../services/tenantSubdomain'

export default async (req, res) => {
  if (!PLANS_CONFIG.stripeSecretKey) {
    throw new Error400(req.language, 'tenant.stripeNotConfigured')
  }

  const stripe = require('stripe')(PLANS_CONFIG.stripeSecretKey)

  const { currentTenant } = req
  const { currentUser } = req

  if (!currentTenant || !currentUser) {
    throw new Error403(req.language)
  }

  if (
    currentTenant.plan !== Plans.values.essential &&
    currentTenant.planStatus !== 'cancel_at_period_end' &&
    currentTenant.planUserId !== currentUser.id
  ) {
    throw new Error403(req.language)
  }

  let { planStripeCustomerId } = currentTenant

  if (!planStripeCustomerId || currentTenant.planUserId !== currentUser.id) {
    const stripeCustomer = await stripe.customers.create({
      email: currentUser.email,
      metadata: {
        tenantId: currentTenant.id,
      },
    })

    planStripeCustomerId = stripeCustomer.id
  }

  await new TenantService(req).updatePlanUser(
    currentTenant.id,
    planStripeCustomerId,
    currentUser.id,
  )

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: Plans.selectStripePriceIdByPlan(req.body.plan),
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${tenantSubdomain.frontendUrl(currentTenant)}/plan`,
    cancel_url: `${tenantSubdomain.frontendUrl(currentTenant)}/plan`,
    customer: planStripeCustomerId,
  })

  await req.responseHandler.success(req, res, session)
}
