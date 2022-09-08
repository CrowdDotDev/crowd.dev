<template>
  <div>
    <div class="webhook-execution-list-header">
      <div class="font-medium">
        {{
          translate(
            `entities.automation.triggers.${webhook.trigger}`
          )
        }}
      </div>
      <div class="text-gray-600">
        {{ webhook.settings.url }}
      </div>
    </div>
    <div
      v-if="loading && executions.length === 0"
      v-loading="loading"
      class="app-page-spinner"
    ></div>
    <div
      v-else
      class="webhook-executions-list-wrapper mt-8"
    >
      <div class="flex items-center mb-3">
        <div
          class="font-semibold text-sm w-20 text-gray-600"
        >
          Status
        </div>
        <div
          class="font-semibold text-sm w-40 text-gray-600"
        >
          Timestamp
        </div>
      </div>
      <ul
        v-infinite-scroll="fetchExecutions"
        :infinite-scroll-disabled="disabled"
        class="webhook-execution-list"
        style="overflow: auto"
      >
        <li
          v-for="execution of executions"
          :key="execution.id"
          class="webhook-execution-list-item"
        >
          <div class="w-20">
            <i
              class="text-base"
              :class="
                execution.state === 'success'
                  ? 'ri-checkbox-circle-line text-green-900'
                  : 'ri-close-circle-line text-red-900'
              "
            />
          </div>
          <div>
            {{ formattedDate(execution.executedAt) }}
          </div>
          <div class="flex justify-end flex-grow j">
            <el-button
              class="btn btn--text"
              @click="payloadModals[execution.id] = true"
              >Payload</el-button
            >
          </div>

          <el-dialog
            v-model="payloadModals[execution.id]"
            title="Payload"
            :destroy-on-close="true"
            @close="payloadModals[execution.id] = false"
          >
            <app-webhook-execution :execution="execution" />
          </el-dialog>
        </li>
      </ul>
      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner"
      ></div>
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
      payloadModals: this.executions.reduce((acc, item) => {
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
  .el-drawer__title {
    @apply text-lg text-black font-medium;
  }

  .webhook-execution-list {
    @apply p-0 m-0;
    list-style: none;
    height: calc(100vh - 300px);

    &-header {
      @apply p-3 rounded text-sm;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    &-item {
      @apply flex items-center text-sm border-t border-gray-100 py-3;

      .el-dialog {
        @apply max-w-2xl;
      }
    }
  }
}
</style>
