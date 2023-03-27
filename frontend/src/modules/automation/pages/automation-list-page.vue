<template>
  <div class="pt-4">
    <div
      v-if="loading('table') && count === 0"
      v-loading="loading('table')"
      class="app-page-spinner"
    />
    <div v-else-if="count > 0">
      <div
        class="flex items-center py-1 mb-3 mt-2"
        :class="count ? 'justify-between' : 'justify-end'"
      >
        <div class="text-gray-500 text-sm">
          {{ pluralize('webhook', count, true) }}
        </div>
        <div>
          <el-button
            class="btn btn--primary btn--sm !h-8"
            @click="onAddWebhookClick"
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
    />

    <!-- Add/Edit Webhook form drawer -->
    <app-webhook-form
      v-if="isAutomationDrawerOpen"
      v-model="newAutomation"
      :is-drawer-open="isAutomationDrawerOpen"
      @success="onCloseAutomationDrawer"
      @cancel="onCloseAutomationDrawer"
    />

    <!-- Executions Drawer -->
    <app-drawer
      v-model="isExecutionsDrawerOpen"
      title="Webhook executions"
      size="600px"
      custom-class="webhook-executions-drawer"
      @close="onCloseExecutionsDrawer"
    >
      <template #content>
        <app-webhook-execution-list :webhook="automation" />
      </template>
    </app-drawer>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import pluralize from 'pluralize';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { router } from '@/router';
import { FeatureFlag } from '@/featureFlag';
import AppAutomationListTable from '@/modules/automation/components/list/automation-list-table.vue';
import AppWebhookForm from '@/modules/automation/components/webhooks/webhook-form.vue';
import AppWebhookExecutionList from '@/modules/automation/components/webhooks/webhook-execution-list.vue';

export default {
  name: 'AppAutomationListPage',
  components: {
    AppWebhookExecutionList,
    AppAutomationListTable,
    AppWebhookForm,
  },
  data() {
    return {
      newAutomation: {
        type: 'webhook',
        settings: {},
      },
      isAutomationDrawerOpen: false,
      isExecutionsDrawerOpen: false,
      automation: null,
    };
  },
  computed: {
    ...mapGetters({
      loading: 'automation/loading',
      filter: 'automation/filter',
      count: 'automation/count',
    }),
  },
  async created() {
    await this.doFetch({
      filter: { ...this.filter },
      rawFilter: { ...this.filter },
    });
  },
  methods: {
    ...mapActions({
      doFetch: 'automation/doFetch',
    }),
    onOpenEditAutomationDrawer(automation) {
      this.isAutomationDrawerOpen = true;
      this.newAutomation = { ...automation };
    },
    onCloseAutomationDrawer() {
      this.newAutomation = {
        type: 'webhook',
        settings: {},
      };
      this.isAutomationDrawerOpen = false;
    },
    onOpenExecutionsDrawer(automation) {
      this.isExecutionsDrawerOpen = true;
      this.automation = automation;
    },
    onCloseExecutionsDrawer() {
      this.isExecutionsDrawerOpen = false;
      this.automation = null;
    },
    async onAddWebhookClick() {
      const isFeatureEnabled = FeatureFlag.isFlagEnabled(
        FeatureFlag.flags.automations,
      );

      if (isFeatureEnabled) {
        this.isAutomationDrawerOpen = true;
      } else {
        await ConfirmDialog({
          vertical: true,
          type: 'danger',
          title:
            'You have reached the limit of 2 automations on your current plan',
          message:
            'Upgrade your plan to get unlimited automations and take full advantage of this feature',
          confirmButtonText: 'Upgrade plan',
        });
        router.push('settings?activeTab=plans');
      }
    },
    pluralize,
  },
};
</script>

<style lang="scss">
.empty-list-icon {
  font-size: 160px;
  @apply leading-none text-gray-200;
}
</style>
