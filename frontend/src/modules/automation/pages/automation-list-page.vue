<template>
  <div class="pt-6">
    <!--    <el-button-->
    <!--      class="btn btn&#45;&#45;primary btn&#45;&#45;sm !h-8"-->
    <!--      @click="authenticateSlack"-->
    <!--    >-->
    <!--      Connect slack-->
    <!--    </el-button>-->
    <div class="flex justify-between pb-3">
      <div class="flex items-center">
        <div class="flex text-xs text-gray-600">
          <div
            v-for="option in options"
            :key="option.value"
            class="h-8 border-solid border-gray-200 border-r border-y first:border-l flex items-center
       justify-center transition hover:bg-gray-50 cursor-pointer first:rounded-l-md last:rounded-r-md px-3 bg"
            :class="type === option.value ? 'font-medium bg-gray-100 text-gray-900' : 'bg-white'"
            @click="type = option.value"
          >
            {{ option.label }}
          </div>
        </div>
        <p class="pl-4 text-xs leading-5 text-gray-500">
          {{ pluralize('automation', totalAutomations, true) }}
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
          <div class="popover-item h-auto mb-1 py-2 px-2.5" @click="createAutomation = 'webhook'">
            <div class="flex">
              <div class="mt-0.5">
                <img alt="Webhook" src="/images/automation/webhook.png" class="w-4 max-w-4">
              </div>
              <div class="pl-2">
                <h6 class="text-xs leading-5 font-medium mb-0.5 text-gray-900">
                  Webhook
                </h6>
                <p class="text-2xs leading-4.5 text-gray-500 break-words">
                  Send webhook payloads to automate workflows
                </p>
              </div>
            </div>
          </div>
          <div class="popover-item h-auto py-2 px-2.5" @click="createAutomation = 'slack'">
            <div class="flex">
              <div class="mt-0.5">
                <img alt="Slack" src="https://cdn-icons-png.flaticon.com/512/3800/3800024.png" class="w-4 max-w-4">
              </div>
              <div class="pl-2">
                <h6 class="text-xs leading-5 font-medium mb-0.5 text-gray-900">
                  Slack notification
                </h6>
                <p class="text-2xs leading-4.5 text-gray-500 break-words">
                  Send notifications to your Slack workspace
                </p>
              </div>
            </div>
          </div>
        </el-popover>
      </div>
    </div>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    />
    <!--    <app-automation-list-table-->
    <!--      v-else-if="totalAutomations > 0"-->
    <!--      class="pt-4"-->
    <!--    />-->
    <!--      @open-executions-drawer="onOpenExecutionsDrawer"-->
    <!--      @open-edit-automation-drawer="-->
    <!--        onOpenEditAutomationDrawer-->
    <!--      "-->
    <!--    />-->

    <!-- Empty state for no automations configured -->
    <app-empty-state-cta
      v-else
      icon="ri-flow-chart"
      title="Start to automate manual tasks"
      description="Create webhook actions or send Slack notifications when a new activity happens, or a new member joins your community"
    />

    <!--    &lt;!&ndash; Add/Edit Webhook form drawer &ndash;&gt;-->
    <app-automation-form
      v-model="createAutomation"
    />

    <!--    &lt;!&ndash; Executions Drawer &ndash;&gt;-->
    <!--    <app-drawer-->
    <!--      v-model="isExecutionsDrawerOpen"-->
    <!--      title="Webhook executions"-->
    <!--      size="600px"-->
    <!--      custom-class="webhook-executions-drawer"-->
    <!--      @close="onCloseExecutionsDrawer"-->
    <!--    >-->
    <!--      <template #content>-->
    <!--        <app-webhook-execution-list :webhook="automation" />-->
    <!--      </template>-->
    <!--    </app-drawer>-->
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAutomationStore } from '@/modules/automation/store';
import { storeToRefs } from 'pinia';
import pluralize from 'pluralize';
import AppAutomationForm from '@/modules/automation/components/automation-form.vue';

const loading = ref(false);
const type = ref('all');
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
    value: 'webhooks',
  },
]);
const createAutomation = ref('webhook');

const automationStore = useAutomationStore();
const { totalAutomations } = storeToRefs(automationStore);
const { getAutomations, getAutomationCount } = automationStore;

const fetchAutomations = (automationType) => {
  loading.value = true;
  getAutomations(automationType)
    .finally(() => {
      loading.value = false;
    });
};

watch(() => type.value, (automationType) => {
  if (automationType === 'all') {
    fetchAutomations();
  } else {
    fetchAutomations(automationType);
  }
});

onMounted(() => {
  getAutomationCount();
  fetchAutomations();
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
