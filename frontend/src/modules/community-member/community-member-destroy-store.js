import { CommunityMemberService } from '@/modules/community-member/community-member-service'
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

        await CommunityMemberService.destroyAll([id])

        commit('DESTROY_SUCCESS')

        Message.success(
          i18n('entities.communityMember.destroy.success')
        )

        router.push('/members')

        dispatch(
          `communityMember/list/doFetch`,
          {
            filter:
              rootGetters[`communityMember/list/filter`]
          },
          {
            root: true
          }
        )
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

        await CommunityMemberService.destroyAll(ids)

        commit('DESTROY_ALL_SUCCESS')

        dispatch(
          `communityMember/list/doUnselectAll`,
          null,
          {
            root: true
          }
        )

        Message.success(
          i18n(
            'entities.communityMember.destroyAll.success'
          )
        )

        router.push('/members')

        dispatch(
          `communityMember/list/doFetch`,
          {
            filter:
              rootGetters[`communityMember/list/filter`]
          },
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
