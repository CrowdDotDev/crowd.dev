import { ActivityService } from '@/modules/activity/activity-service'
import Errors from '@/shared/error/errors'
import { router } from '@/router'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'

export default {
  namespaced: true,

  state: () => {
    return {
      loading: false
    }
  },

  getters: {
    loading: (state) => Boolean(state.loading)
  },

  mutations: {
    DESTROY_ALL_STARTED(state) {
      state.loading = true
    },

    DESTROY_ALL_SUCCESS(state) {
      state.loading = false
    },

    DESTROY_ALL_ERROR(state) {
      state.loading = false
    },

    DESTROY_STARTED(state) {
      state.loading = true
    },

    DESTROY_SUCCESS(state) {
      state.loading = false
    },

    DESTROY_ERROR(state) {
      state.loading = false
    }
  },

  actions: {
    async doDestroy({ commit, dispatch, rootGetters }, id) {
      try {
        commit('DESTROY_STARTED')

        await ActivityService.destroyAll([id])

        commit('DESTROY_SUCCESS')

        Message.success(
          i18n('entities.activity.destroy.success')
        )

        if (router.currentRoute.name.includes('activity')) {
          if (router.currentRoute.name === 'activityView') {
            router.push('/activities')
          }
          dispatch(
            `activity/list/doFetch`,
            rootGetters[`activity/list/filter`],
            {
              root: true
            }
          )
        } else {
          window.location.reload()
        }
      } catch (error) {
        Errors.handle(error)
        commit('DESTROY_ERROR')
      }
    },

    async doDestroyAll(
      { commit, dispatch, rootGetters },
      ids
    ) {
      try {
        commit('DESTROY_ALL_STARTED')

        await ActivityService.destroyAll(ids)

        commit('DESTROY_ALL_SUCCESS')

        dispatch(`activity/list/doUnselectAll`, null, {
          root: true
        })

        Message.success(
          i18n('entities.activity.destroyAll.success')
        )

<<<<<<< HEAD
        if (router.currentRoute.name === 'activityView') {
=======
        if (
          createRouter().currentRoute.name ===
          'activityView'
        ) {
>>>>>>> 1a50d0d (Fix router and store)
          router.push('/activities')
        }

        dispatch(
          `activity/list/doFetch`,
          rootGetters[`activity/list/filter`],
          {
            root: true
          }
        )
      } catch (error) {
        Errors.handle(error)
        commit('DESTROY_ALL_ERROR')
      }
    }
  }
}
