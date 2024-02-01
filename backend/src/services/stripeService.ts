import { Stripe } from 'stripe'
import { TenantPlans } from '@crowd/types'
import { PLANS_CONFIG } from '@/conf'

const stripe = new Stripe(PLANS_CONFIG.stripeSecretKey, {
  apiVersion: '2022-08-01',
  typescript: true,
})

class StripeService {
  static async retreiveSession(sessionId: string) {
    return stripe.checkout.sessions.retrieve(sessionId)
  }

  static async retreiveSubscription(subscriptionId: string) {
    return stripe.subscriptions.retrieve(subscriptionId)
  }

  static getPlanFromProductId(productId: string) {
    if (productId === PLANS_CONFIG.stripeScalePlanProductId) {
      return TenantPlans.Scale
    }
    if (productId === PLANS_CONFIG.stripeEssentialPlanProductId) {
      return TenantPlans.Essential
    }
    if (productId === PLANS_CONFIG.stripeEagleEyePlanProductId) {
      return TenantPlans.EagleEye
    }
    if (productId === PLANS_CONFIG.stripeGrowthPlanProductId) {
      return TenantPlans.Growth
    }
    return null
  }
}

export default StripeService
