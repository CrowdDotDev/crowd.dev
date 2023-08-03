<template>
  <div class="pt-6">
    <div class="flex justify-between pb-6">
      <div class="flex items-center">
        <div class="flex text-xs text-gray-600">
          <div
            v-for="option in options"
            :key="option.value"
            class="h-8 border-solid border-gray-200 border-r border-y first:border-l flex items-center
       justify-center transition hover:bg-gray-50 cursor-pointer first:rounded-l-md last:rounded-r-md px-3 bg"
            :class="filter.type === option.value ? 'font-medium bg-gray-100 text-gray-900' : 'bg-white'"
            @click="changeAutomationFilter({ type: option.value })"
          >
            {{ option.label }}
          </div>
        </div>
        <p class="pl-4 text-xs leading-5 text-gray-500">
          {{ pluralize('automation', automations.length, true) }}
        </p>
      </div>
      <div>
        <el-popover
          trigger="click"
          placement="bottom-end"
          width="15rem"
          popper-class="!p-2"
        >
          <template #reference>
            <el-button class="btn btn--primary btn--sm flex items-center !py-2">
              Add automation
              <span class="ri-arrow-down-s-line text-base ml-2 flex items-center h-4" />
            </el-button>
          </template>
          <div class="popover-item h-auto mb-1 py-2 px-2.5" @click="createAutomation('webhook')">
            <div class="flex">
              <div class="mt-0.5">
                <img alt="Webhook" src="/images/automation/webhook.png" class="w-4 max-w-4">
              </div>
              <div class="pl-2">
                <h6 class="text-xs leading-5 font-medium mb-0.5 text-gray-900">
                  Webhook
                </h6>
                <p class="text-2xs leading-4.5 text-gray-500 text-left break-normal">
                  Send webhook payloads to automate workflows
                </p>
              </div>
            </div>
          </div>
          <div
            class="popover-item  h-auto py-2 px-2.5"
            :class="{ 'hover:bg-white !cursor-default': !slackConnected }"
            @click="createSlackAutomation"
          >
            <div class="flex">
              <div class="mt-0.5">
                <img alt="Slack" src="https://cdn-icons-png.flaticon.com/512/3800/3800024.png" class="w-4 max-w-4">
              </div>
              <div class="pl-2">
                <h6 class="text-xs leading-5 font-medium mb-0.5 text-gray-900">
                  Slack notification
                </h6>
                <p class="text-2xs leading-4.5 text-gray-500 text-left break-normal">
                  Send notifications to your Slack workspace
                </p>
                <el-button
                  v-if="!slackConnected"
                  class="btn btn--primary btn--sm !h-8 mt-3"
                  @click="authenticateSlack"
                >
                  Install app
                </el-button>
              </div>
            </div>
          </div>
        </el-popover>
      </div>
    </div>
    <div
      v-if="loadingAutomations"
      v-loading="loadingAutomations"
      class="app-page-spinner"
    />
    <app-automation-list-table
      v-else-if="automations.length > 0"
      class="pt-4"
      @open-executions-drawer="showAutomationExecutions = $event"
      @open-edit-automation-drawer="updateAutomation($event)"
    />

    <!-- Empty state for no automations configured -->
    <app-empty-state-cta
      v-else-if="filter.type === 'slack'"
      icon="ri-flow-chart"
      title="No Slack notifications yet"
      description="Send Slack notifications when a new activity happens, or a new contributor joins your community"
    />
    <app-empty-state-cta
      v-else-if="filter.type === 'webhook'"
      icon="ri-flow-chart"
      title="No Webhooks yet"
      description="Create webhook actions when a new activity happens, or a new contributor joins your community"
    />
    <app-empty-state-cta
      v-else
      icon="ri-flow-chart"
      title="Start to automate manual tasks"
      description="Create webhook actions or send Slack notifications when a new activity happens, or a new contributor joins your community "
    />

    <!-- Add/Edit Webhook form drawer -->
    <app-automation-form
      v-if="openAutomationForm"
      v-model="openAutomationForm"
      v-model:automation="editAutomation"
      :type="automationFormType"
    />

    <app-automation-executions v-model="showAutomationExecutions" />
  </div>
</template>

<script setup>
import {
  ref, onMounted, computed,
} from 'vue';
import { useAutomationStore } from '@/modules/automation/store';
import { storeToRefs } from 'pinia';
import pluralize from 'pluralize';
import AppAutomationForm from '@/modules/automation/components/automation-form.vue';
import AppAutomationListTable from '@/modules/automation/components/list/automation-list-table.vue';
import config from '@/config';
import { AuthToken } from '@/modules/auth/auth-token';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppAutomationExecutions from '@/modules/automation/components/automation-executions.vue';
import { FeatureFlag } from '@/featureFlag';
import { getWorkflowMax, showWorkflowLimitDialog } from '@/modules/automation/automation-limit';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { ActivityTypeService } from '@/modules/activity/services/activity-type-service';

const options = ref([
  {
    label: 'All',
    value: 'all',
  },
  {
    label: 'Slack notifications',
    value: 'slack',
  },
  {
    label: 'Webhooks',
    value: 'webhook',
  },
]);
const openAutomationForm = ref(false);
const automationFormType = ref(null);
const showAutomationExecutions = ref(null);
const editAutomation = ref(null);

const automationStore = useAutomationStore();
const {
  filter, loadingAutomations, automations,
} = storeToRefs(automationStore);
const { getAutomations, changeAutomationFilter } = automationStore;

const activityTypeStore = useActivityTypeStore();
const { setTypes } = activityTypeStore;

const { currentTenant } = mapGetters('auth');

/**
 * Check if tenant has feature flag enabled
 */
const canAddAutomation = () => {
  const isFeatureEnabled = FeatureFlag.isFlagEnabled(
    FeatureFlag.flags.automations,
  );

  if (!isFeatureEnabled) {
    const planWorkflowCountMax = getWorkflowMax(
      currentTenant.value.plan,
    );

    if(planWorkflowCountMax === 'unlimited'){
      return true;
    }

    showWorkflowLimitDialog({ planWorkflowCountMax });
  }

  return isFeatureEnabled;
};

// Executions drawer
const createAutomation = (type) => {
  if (!canAddAutomation()) {
    return;
  }

  openAutomationForm.value = true;
  editAutomation.value = null;
  automationFormType.value = type;
};

const updateAutomation = (automation) => {
  openAutomationForm.value = true;
  automationFormType.value = automation.type;
  editAutomation.value = automation;
};

// Slack connect
const slackConnected = computed(() => currentTenant.value?.settings[0].slackWebHook);

const slackConnectUrl = computed(() => {
  const redirectUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?activeTab=automations&success=true`;

  return `${config.backendUrl}/tenant/${
    currentTenant.value.id
  }/automation/slack?redirectUrl=${redirectUrl}&crowdToken=${AuthToken.get()}`;
});

const authenticateSlack = () => {
  window.open(slackConnectUrl.value, '_self');
};

const createSlackAutomation = () => {
  if (slackConnected.value) {
    if (!canAddAutomation()) {
      return;
    }

    createAutomation('slack');
  }
};

onMounted(async () => {
  getAutomations();

  const activityTypes = await ActivityTypeService.get();
  setTypes(activityTypes);
});

</script>

<script>
export default {
  name: 'AppAutomationListPage',
};
</script>

<style lang="scss">
.empty-list-icon {
  font-size: 160px;
  @apply leading-none text-gray-200;
}
</style>
