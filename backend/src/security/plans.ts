import { getConfig } from '../config'

class Plans {
  static get values() {
    return {
      free: 'free',
      beta: 'beta',
      premium: 'premium',
      enterprise: 'enterprise',
    }
  }

  static selectPlanByStripePriceId(stripePriceId) {
    const premiumStripePriceId = getConfig().PLAN_STRIPE_PRICES_PREMIUM
    const enterpriseStripePriceId = getConfig().PLAN_STRIPE_PRICES_ENTERPRISE

    if (premiumStripePriceId === stripePriceId) {
      return Plans.values.premium
    }

    if (enterpriseStripePriceId === stripePriceId) {
      return Plans.values.enterprise
    }

    return Plans.values.free
  }

  static selectStripePriceIdByPlan(plan) {
    if (plan === Plans.values.premium) {
      return getConfig().PLAN_STRIPE_PRICES_PREMIUM
    }

    if (plan === Plans.values.enterprise) {
      return getConfig().PLAN_STRIPE_PRICES_ENTERPRISE
    }

    return null
  }

  /**
   * When the plan is:
   * - active: The plan will be active.
   * - cancel_at_period_end: The plan will remain active until the end of the period.
   * - error: The plan will remain active, but a warning message will be displayed to the user.
   * - canceled: The workspace plan will change to Free.
   */
  static selectPlanStatus(stripePlan) {
    if (!stripePlan) {
      return 'canceled'
    }

    const { status, cancelAtPeriodEnd } = stripePlan

    if (status === 'active') {
      if (cancelAtPeriodEnd) {
        return 'cancel_at_period_end'
      }

      return 'active'
    }

    if (status === 'canceled' || status === 'incomplete_expired') {
      return 'canceled'
    }

    return 'error'
  }

  /**
   * If the plan exists and it is not marked
   * to cancel, the tenant can't be destroyed,
   * because future charges might occur
   */
  static allowTenantDestroy(plan, planStatus) {
    if (plan === Plans.values.free || plan === Plans.values.beta) {
      return true
    }

    return planStatus === 'cancel_at_period_end'
  }
}

export default Plans
