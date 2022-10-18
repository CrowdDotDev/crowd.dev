<template>
  <app-page-wrapper>
    <div class="activity-list-page">
      <h1 class="app-content-title">
        <app-i18n
          code="entities.activity.list.title"
        ></app-i18n>
      </h1>

      <app-activity-list-tabs></app-activity-list-tabs>
      <app-activity-list-feed
        v-if="activeView.type === 'activities'"
      ></app-activity-list-feed>
      <div v-else-if="activeView.type === 'conversations'">
        <div
          v-for="conversation of rows"
          :key="conversation.id"
          class="panel"
        >
          Conversation: {{ conversation.title }}
        </div>
      </div>
    </div>
  </app-page-wrapper>
</template>

<script>
import { mapGetters } from 'vuex'
import { ActivityPermissions } from '@/modules/activity/activity-permissions'
import AppPageWrapper from '@/modules/layout/components/page-wrapper.vue'
import ActivityListFeed from '@/modules/activity/components/list/activity-list-feed.vue'
import AppActivityListTabs from '@/modules/activity/components/list/activity-list-tabs'

export default {
  name: 'AppActivityListPage',

  components: {
    AppActivityListTabs,
    'app-activity-list-feed': ActivityListFeed,
    AppPageWrapper
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
      activeView: 'activity/activeView'
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
