<template>
  <div>
    <div class="webhook-executions-list-wrapper">
      <div class="webhook-execution-list-header">
        <div class="font-medium">
          {{
            translate(
              `entities.automation.triggers.${webhook.trigger}`
            )
          }}
        </div>
        <div class="text-gray-500 text-2xs">
          {{ webhook.settings.url }}
        </div>
      </div>
      <div
        class="flex items-center pb-2 mt-8 border-b border-gray-200"
      >
        <div
          class="font-semibold tracking-wide uppercase text-2xs w-20 text-gray-400"
        >
          Status
        </div>
        <div
          class="font-semibold tracking-wide uppercase text-2xs w-40 text-gray-400"
        >
          Timestamp
        </div>
      </div>

      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner"
      ></div>
      <!-- Executions list -->
      <div
        v-else-if="executions && executions.length > 0"
        v-infinite-scroll="fetchExecutions"
        :infinite-scroll-disabled="disabled"
        class="webhook-execution-list"
        style="overflow: auto"
      >
        <ul>
          <li
            v-for="execution of executions"
            :key="execution.id"
            class="webhook-execution-list-item"
          >
            <div class="w-20">
              <i
                class="text-lg"
                :class="
                  execution.state === 'success'
                    ? 'ri-checkbox-circle-line text-green-500'
                    : 'ri-close-circle-line text-red-500'
                "
              />
            </div>
            <div class="text-gray-900">
              {{ formattedDate(execution.executedAt) }}
            </div>
            <div class="flex justify-end flex-grow mr-1">
              <el-button
                class="btn btn-brand--transparent btn--sm !h-8"
                @click="modals[execution.id] = true"
                >Payload</el-button
              >
            </div>

            <app-dialog
              v-model="modals[execution.id]"
              title="Execution log"
            >
              <template #content>
                <app-webhook-execution
                  :execution="execution"
                />
              </template>
            </app-dialog>
          </li>
        </ul>
      </div>
      <div v-else class="mt-8">
        <!-- Empty state -->
        <app-empty-state
          icon="ri-folder-3-line"
          description="There are no execution logs yet"
        ></app-empty-state>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { i18n } from '@/i18n'
import { computed, ref, reactive } from 'vue'
import { AutomationService } from '@/modules/automation/automation-service'
import AppWebhookExecution from './webhook-execution'

export default {
  name: 'AppAutomationExecutionList',
  components: {
    AppWebhookExecution
  },
  props: {
    webhook: {
      type: Object,
      default: () => {}
    }
  },
  setup(props) {
    const limit = ref(5)
    const offset = ref(0)
    const loading = ref(false)
    const noMore = ref(false)
    const disabled = computed(
      () => loading.value || noMore.value
    )
    const executions = reactive([])

    const fetchExecutions = async () => {
      if (noMore.value) {
        return
      }
      loading.value = true
      const response =
        await AutomationService.listAutomationExecutions(
          props.webhook.id,
          'createdAt_DESC',
          limit.value,
          offset.value
        )
      loading.value = false
      if (response.rows.length < limit.value) {
        noMore.value = true
        executions.push(...response.rows)
      } else {
        offset.value += limit.value
        executions.push(...response.rows)
      }
    }

    return {
      loading,
      noMore,
      disabled,
      executions,
      fetchExecutions
    }
  },
  data() {
    return {
      modals: this.executions.reduce((acc, item) => {
        acc[item.id] = false
        return acc
      }, {})
    }
  },
  async created() {
    await this.fetchExecutions()
  },
  methods: {
    translate(key) {
      return i18n(key)
    },
    formattedDate(date) {
      return moment(date).format('YYYY-MM-DD HH:mm:ss')
    }
  }
}
</script>

<style lang="scss">
.webhook-executions-drawer {
  .webhook-execution-list {
    @apply p-0 m-0;
    list-style: none;
    height: calc(100vh - 300px);

    &-header {
      @apply p-4 rounded-md text-sm bg-gray-50 text-gray-900;
    }

    &-item {
      @apply flex items-center text-sm border-b border-gray-200 py-3;

      .el-dialog {
        @apply max-w-2xl;
      }
    }
  }
}
</style>
