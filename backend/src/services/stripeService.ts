import { Stripe } from 'stripe'
import { PLANS_CONFIG } from '@/conf'
import Plans from '@/security/plans'

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
      return Plans.values.scale
    }
    if (productId === PLANS_CONFIG.stripeEssentialPlanProductId) {
      return Plans.values.essential
    }
    if (productId === PLANS_CONFIG.stripeEagleEyePlanProductId) {
      return Plans.values.eagleEye
    }
    if (productId === PLANS_CONFIG.stripeGrowthPlanProductId) {
      return Plans.values.growth
    }
    return null
  }
}

export default StripeService
