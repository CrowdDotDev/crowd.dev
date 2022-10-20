<template>
  <app-page-wrapper>
    <div class="activity-list-page">
      <h4>
        <app-i18n
          code="entities.activity.list.title"
        ></app-i18n>
      </h4>
      <div class="text-xs text-gray-500 mb-10">
        Track all the actions that members do in your
        community
      </div>

      <app-activity-list-tabs></app-activity-list-tabs>
      <app-activity-list-filter
        :module="activeView.type"
      ></app-activity-list-filter>
      <app-activity-list
        v-if="activeView.type === 'activities'"
        :activities="recordsArray"
        :loading="loading"
        :items-as-cards="true"
      ></app-activity-list>
      <app-conversation-list
        v-else-if="activeView.type === 'conversations'"
        :conversations="recordsArray"
        :loading="loading"
        :items-as-cards="true"
      ></app-conversation-list>
    </div>
  </app-page-wrapper>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { ActivityPermissions } from '@/modules/activity/activity-permissions'
import AppPageWrapper from '@/modules/layout/components/page-wrapper.vue'
import AppActivityList from '@/modules/activity/components/activity-list'
import AppConversationList from '@/modules/conversation/components/conversation-list'
import AppActivityListTabs from '@/modules/activity/components/activity-list-tabs'
import AppActivityListFilter from '@/modules/activity/components/list/activity-list-filter.vue'
import AppI18n from '@/shared/i18n/i18n'

export default {
  name: 'AppActivityListPage',

  components: {
    AppI18n,
    AppActivityList,
    AppConversationList,
    AppActivityListTabs,
    AppPageWrapper,
    AppActivityListFilter
  },

  data() {
    return {
      creating: false
    }
  },
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser',
      activeView: 'activity/activeView',
      recordsArray: 'activity/rows'
    }),
    ...mapState({
      loading: (state) => state.activity.list.loading
    }),
    hasPermissionToCreate() {
      return new ActivityPermissions(
        this.currentTenant,
        this.currentUser
      ).create
    }
  },

  async mounted() {
    window.analytics.page('Activities')
  }
}
</script>

<style></style>
