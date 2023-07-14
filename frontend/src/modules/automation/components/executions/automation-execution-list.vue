<template>
  <div>
    <header class="py-2 border-b border-gray-200 flex items-center">
      <div class="w-20">
        <p
          class="text-2xs leading-5 uppercase font-semibold tracking-1 text-gray-400"
        >
          Type
        </p>
      </div>
      <div>
        <p
          class="text-2xs leading-5 uppercase font-semibold tracking-1 text-gray-400"
        >
          Timestamp
        </p>
      </div>
    </header>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    />
    <div v-else-if="executions.length > 0">
      <article v-for="execution of executions" :key="execution.id" class="border-b border-gray-200 py-3 flex items-center">
        <div class="w-20">
          <span v-if="execution.state === 'success'" class="ri-checkbox-circle-line text-lg text-green-600" />
          <span v-else class="ri-close-circle-line text-lg text-red-500" />
        </div>
        <div class="flex-grow">
          {{ formatDate(execution.executedAt) }}
        </div>
        <div>
          <el-button class="btn btn--secondary !text-red-500 btn--sm !h-8" @click="executionDetails = execution">
            Payload
          </el-button>
        </div>
      </article>
    </div>
    <app-empty-state
      v-else
      icon="ri-folder-3-line"
      description="There are no execution logs yet"
    />
    <app-dialog
      :model-value="executionDetails !== null"
      title="Execution log"
      @close="executionDetails = null"
    >
      <template #content>
        <app-automation-execution
          v-if="executionDetails"
          :execution="executionDetails"
          :automation="automation"
        />
      </template>
    </app-dialog>
  </div>
</template>

<script setup>
import { defineProps, onMounted, ref } from 'vue';
import { AutomationService } from '@/modules/automation/automation-service';
import moment from 'moment';
import AppDialog from '@/shared/dialog/dialog.vue';
import AppAutomationExecution from '@/modules/automation/components/executions/automation-execution.vue';

const props = defineProps({
  automation: {
    type: Object,
    default: () => null,
  },
});

const loading = ref(false);
const perPage = ref(10);
const page = ref(1);
const total = ref(0);
const executions = ref([]);
const executionDetails = ref(null);

const fetchExecutions = () => {
  loading.value = true;
  AutomationService.listAutomationExecutions(
    props.automation.id,
    null,
    perPage.value,
    (page.value - 1) * perPage.value,
  )
    .then(({ rows, count }) => {
      total.value = count;
      executions.value = [...executions.value, ...rows];
    })
    .finally(() => {
      loading.value = false;
    });
};

const formatDate = (date) => moment(date).format('DD-MM-YYYY HH:mm:ss');

onMounted(() => {
  page.value = 1;
  total.value = 0;
  executions.value = [];
  fetchExecutions();
});
</script>

<script>
export default {
  name: 'AppAutomationExecutionList',
};
</script>
