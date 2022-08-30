import { CommunityMemberService } from '@/modules/community-member/community-member-service'
import Errors from '@/shared/error/errors'
import { router } from '@/router'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'

export default {
  namespaced: true,

  state: () => {
    return {
      initLoading: false,
      saveLoading: false,
      record: null
    }
  },

  getters: {
    record: (state) => state.record,
    initLoading: (state) => Boolean(state.initLoading),
    saveLoading: (state) => Boolean(state.saveLoading)
  },

  mutations: {
    RESET(state) {
      state.initLoading = false
      state.saveLoading = false
      state.record = null
    },

    INIT_STARTED(state) {
      state.record = null
      state.initLoading = true
    },

    INIT_SUCCESS(state, payload) {
      state.record = payload
      state.initLoading = false
    },

    INIT_ERROR(state) {
      state.record = null
      state.initLoading = false
    },

    CREATE_STARTED(state) {
      state.saveLoading = true
    },

    CREATE_SUCCESS(state) {
      state.saveLoading = false
    },

    CREATE_ERROR(state) {
      state.saveLoading = false
    },

    UPDATE_STARTED(state) {
      state.saveLoading = true
    },

    UPDATE_SUCCESS(state) {
      state.saveLoading = false
    },

    UPDATE_ERROR(state) {
      state.saveLoading = false
    }
  },

  actions: {
    async doInit({ commit }, id) {
      try {
        commit('INIT_STARTED')

        let record = null

        if (id) {
          record = await CommunityMemberService.find(id)
        }

        commit('INIT_SUCCESS', record)
      } catch (error) {
        Errors.handle(error)
        commit('INIT_ERROR')
        router.push('/members')
      }
    },

    async doCreate(
      { commit, dispatch, rootGetters },
      values
    ) {
      try {
        commit('CREATE_STARTED')
        await CommunityMemberService.create(values)
        commit('CREATE_SUCCESS')
        Message.success(
          i18n('entities.communityMember.create.success')
        )
        dispatch(
          'communityMember/list/doFetch',
          {
            filter:
              rootGetters['communityMember/list/rawFilter']
          },
          { root: true }
        )
      } catch (error) {
        Errors.handle(error)
        commit('CREATE_ERROR')
      }
    },

    async doUpdate(
      { commit, dispatch, rootGetters },
      { id, values }
    ) {
      try {
        commit('UPDATE_STARTED')

        await CommunityMemberService.update(id, values)

        commit('UPDATE_SUCCESS')
        Message.success(
          i18n('entities.communityMember.update.success')
        )
        if (
          router.currentRoute.name === 'communityMember'
        ) {
          dispatch(
            'communityMember/list/doFetch',
            {
              filter:
                rootGetters[
                  'communityMember/list/rawFilter'
                ]
            },
            { root: true }
          )
        } else {
          dispatch('communityMember/view/doFind', id, {
            root: true
          })
        }
      } catch (error) {
        Errors.handle(error)
        commit('UPDATE_ERROR')
      }
    }
  }
}
