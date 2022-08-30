import Errors from '@/shared/error/errors'
import config from '@/config'
import { PlanService } from './plan-service'
import Plans from '@/security/plans'

export default {
  namespaced: true,

  state: () => {
    return {
      loading: false
    }
  },

  getters: {
    loading: (state) => Boolean(state.loading),
    isPlanUser: (
      state,
      getters,
      rootState,
      rootGetters
    ) => {
      const currentUser = rootGetters['auth/currentUser']
      const currentTenant =
        rootGetters['auth/currentTenant']

      if (!currentUser || !currentTenant) {
        return false
      }

      if (
        currentTenant.plan !== Plans.values.free &&
        currentTenant.planStatus !==
          'cancel_at_period_end' &&
        currentTenant.planUserId !== currentUser.id
      ) {
        return false
      }

      return true
    }
  },

  mutations: {
    CHECKOUT_STARTED(state) {
      state.loading = true
    },

    CHECKOUT_SUCCESS(state) {
      state.loading = false
    },

    CHECKOUT_ERROR(state) {
      state.loading = false
    },

    PORTAL_STARTED(state) {
      state.loading = true
    },

    PORTAL_SUCCESS(state) {
      state.loading = false
    },

    PORTAL_ERROR(state) {
      state.loading = false
    }
  },

  actions: {
    async doCheckout({ commit }, plan) {
      try {
        commit('CHECKOUT_STARTED')

        const sessionId = await PlanService.fetchCheckoutSessionId(
          plan
        )

        const stripe = window.Stripe(
          config.stripePublishableKey
        )
        const result = await stripe.redirectToCheckout({
          sessionId
        })

        if (result.error.message) {
          throw new Error(result.error.message)
        }

        commit('CHECKOUT_SUCCESS')
      } catch (error) {
        Errors.showMessage(error)
        commit('CHECKOUT_ERROR')
      }
    },

    async doPortal({ commit }) {
      try {
        commit('PORTAL_STARTED')

        const url = await PlanService.fetchPortalUrl()
        window.location.href = url

        commit('PORTAL_SUCCESS')
      } catch (error) {
        Errors.showMessage(error)
        commit('PORTAL_ERROR')
      }
    }
  }
}
