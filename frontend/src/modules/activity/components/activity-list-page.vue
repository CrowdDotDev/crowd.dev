<template>
  <div>
    <h1 class="app-content-title">
      <app-i18n
        code="entities.activity.list.title"
      ></app-i18n>
    </h1>
    <div class="flex items-center justify-between mb-4">
      <app-activity-platform-tabs />
      <div class="flex items-center justify-end">
        <div id="teleport-activity-filter-toggle"></div>
        <el-button
          v-if="hasPermissionToCreate"
          class="btn btn--primary ml-2"
          @click.prevent="creating = true"
        >
          <i class="ri-lg ri-add-line mr-1" />
          <app-i18n code="common.new"></app-i18n>
        </el-button>
      </div>
    </div>

    <el-dialog
      v-model:visible="creating"
      title="New Activity"
      :append-to-body="true"
      :destroy-on-close="true"
      custom-class="el-dialog--lg"
      @close="creating = false"
    >
      <app-activity-form-page @cancel="creating = false">
      </app-activity-form-page>
    </el-dialog>
    <app-activity-list-filter></app-activity-list-filter>
    <app-activity-list-feed></app-activity-list-feed>
  </div>
</template>

<script>
import ActivityPlatformTabs from '@/modules/activity/components/activity-platform-tabs.vue'
import ActivityListFilter from '@/modules/activity/components/activity-list-filter.vue'
import ActivityListFeed from '@/modules/activity/components/activity-list-feed.vue'
import ActivityFormPage from '@/modules/activity/components/activity-form-page.vue'
import { ActivityPermissions } from '@/modules/activity/activity-permissions'

export default {
  name: 'AppActivityListPage',

  components: {
    'app-activity-list-filter': ActivityListFilter,
    'app-activity-list-feed': ActivityListFeed,
    'app-activity-platform-tabs': ActivityPlatformTabs,
    'app-activity-form-page': ActivityFormPage
  },

  data() {
    return {
      creating: false
    }
  },
  computed: {
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
