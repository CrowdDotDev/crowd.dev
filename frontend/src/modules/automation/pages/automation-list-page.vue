<template>
  <div class="pt-4">
    <div
      v-if="loading('table') && count === 0"
      v-loading="loading('table')"
      class="app-page-spinner"
    ></div>
    <div v-else-if="count > 0">
      <div
        class="flex items-center py-1 mb-3 mt-2"
        :class="count ? 'justify-between' : 'justify-end'"
      >
        <div class="text-gray-500 text-sm">
          {{ count }} webhook{{ count === 1 ? '' : 's' }}
        </div>
        <div>
          <el-button
            class="btn btn--primary btn--sm !h-8"
            @click="isAutomationDrawerOpen = true"
          >
            Add webhook
          </el-button>
        </div>
      </div>

      <!-- Webhooks list -->
      <app-automation-list-table
        class="pt-4"
        @open-executions-drawer="onOpenExecutionsDrawer"
        @open-edit-automation-drawer="
          onOpenEditAutomationDrawer
        "
      />
    </div>

    <!-- Empty state for no webhooks configured -->
    <app-empty-state-cta
      v-else
      icon="ri-flow-chart"
      title="Start to automate manual tasks"
      description="Create webhook actions for when a new activity
        happens, or a new member joins your community"
      cta-btn="Add webhook"
      @cta-click="isAutomationDrawerOpen = true"
    ></app-empty-state-cta>

    <!-- Add/Edit Webhook form drawer -->
    <app-webhook-form
      v-if="isAutomationDrawerOpen"
      v-model="newAutomation"
      :is-drawer-open="isAutomationDrawerOpen"
      @success="onCloseAutomationDrawer"
      @cancel="onCloseAutomationDrawer"
    />

    <!-- Executions Drawer -->
    <el-drawer
      v-model="isExecutionsDrawerOpen"
      :destroy-on-close="true"
      :close-on-click-modal="false"
      title="Webhook executions"
      custom-class="webhook-executions-drawer"
      size="600px"
      @closed="onCloseExecutionsDrawer"
    >
      <app-webhook-execution-list :webhook="automation" />
    </el-drawer>
  </div>
</template>

<script>
import AppAutomationListTable from '@/modules/automation/components/list/automation-list-table'
import AppWebhookForm from '@/modules/automation/components/webhooks/webhook-form'
import AppWebhookExecutionList from '@/modules/automation/components/webhooks/webhook-execution-list'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'AppAutomationListPage',
  components: {
    AppWebhookExecutionList,
    AppAutomationListTable,
    AppWebhookForm
  },
  data() {
    return {
      newAutomation: {
        type: 'webhook',
        settings: {}
      },
      isAutomationDrawerOpen: false,
      isExecutionsDrawerOpen: false,
      automation: null
    }
  },
  computed: {
    ...mapGetters({
      loading: 'automation/loading',
      filter: 'automation/filter',
      count: 'automation/count'
    })
  },
  async created() {
    await this.doFetch({
      filter: { ...this.filter },
      rawFilter: { ...this.filter }
    })
  },
  methods: {
    ...mapActions({
      doFetch: 'automation/doFetch'
    }),
    onOpenEditAutomationDrawer(automation) {
      this.isAutomationDrawerOpen = true
      this.newAutomation = { ...automation }
    },
    onCloseAutomationDrawer() {
      this.newAutomation = {
        type: 'webhook',
        settings: {}
      }
      this.isAutomationDrawerOpen = false
    },
    onOpenExecutionsDrawer(automation) {
      this.isExecutionsDrawerOpen = true
      this.automation = automation
    },
    onCloseExecutionsDrawer() {
      this.isExecutionsDrawerOpen = false
      this.automation = null
    }
  }
}
</script>

<style lang="scss">
.empty-list-icon {
  font-size: 160px;
  @apply leading-none text-gray-200;
}
</style>
