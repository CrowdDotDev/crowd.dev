import { Error400, Error403 } from '@crowd/common'
import { PLANS_CONFIG } from '../../../conf'
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

  const session = await stripe.billingPortal.sessions.create({
    customer: planStripeCustomerId,
    return_url: `${tenantSubdomain.frontendUrl(currentTenant)}/plan`,
  })

  await req.responseHandler.success(req, res, session)
}
