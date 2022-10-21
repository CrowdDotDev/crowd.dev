<template>
  <div>
    <div
      v-if="loading('table') && count === 0"
      v-loading="loading('table')"
      class="app-page-spinner"
    ></div>
    <div v-else-if="count > 0">
      <div class="flex items-center justify-between mt-6">
        <div class="text-gray-600 text-sm">
          {{ count }} webhook{{ count === 1 ? '' : 's' }}
        </div>
        <div>
          <el-button
            class="btn btn--primary"
            @click="isAutomationDrawerOpen = true"
          >
            <i class="ri-lg ri-add-line mr-1"></i>
            New webhook
          </el-button>
        </div>
      </div>
      <app-automation-list-table class="mt-6" />
    </div>
    <div
      v-else
      class="flex flex-col items-center justify-center pt-20 pb-10"
    >
      <i class="ri-flow-chart empty-list-icon mb-8"></i>

      <h5>Start to automate manual tasks</h5>
      <div
        class="text-gray-600 text-sm mt-4 w-6/12 text-center"
      >
        Create webhook actions for when a new activity
        happens, or a new member joins your community
      </div>
      <el-button
        class="btn btn--primary btn--md mt-8"
        @click="isAutomationDrawerOpen = true"
      >
        Add webhook
      </el-button>
    </div>
    <app-webhook-form
      v-model="newAutomation"
      :is-drawer-open="isAutomationDrawerOpen"
      @success="handleSuccess"
      @cancel="isAutomationDrawerOpen = false"
    />
  </div>
</template>

<script>
import AppAutomationListTable from './automation-list-table'
import AppWebhookForm from './webhooks/webhook-form'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'AppAutomationListPage',
  components: {
    AppAutomationListTable,
    AppWebhookForm
  },
  data() {
    return {
      newAutomation: {
        type: 'webhook',
        settings: {}
      },
      isAutomationDrawerOpen: false
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
    handleSuccess() {
      this.newAutomation = {
        type: 'webhook',
        settings: {}
      }
      this.isAutomationDrawerOpen = false
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
