<template>
  <Suspense>
    <div class="webhook-header">
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
      class="webhook-executions-list-wrapper"
      style="overflow: auto"
    >
      <ul
        v-infinite-scroll="fetchExecutions"
        :infinite-scroll-disabled="disabled"
        class="webhook-executions-list"
      >
        <li
          v-for="execution of executions"
          :key="execution.id"
          class="webhook-executions-list-item"
        >
          {{ execution.state }}, {{ execution.executedAt }}
        </li>
      </ul>
      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner"
      ></div>
    </div>
  </Suspense>
</template>

<script>
import { i18n } from '@/i18n'
import { computed, ref } from 'vue'
import { AutomationService } from '@/modules/automation/automation-service'

export default {
  name: 'AppAutomationExecutions',
  props: {
    webhook: {
      type: Object,
      default: () => {}
    }
  },
  async setup(props) {
    const limit = ref(20)
    const offset = ref(0)
    const loading = ref(false)
    const noMore = ref(false)
    const disabled = computed(
      () => loading.value || noMore.value
    )
    const executions = ref([])

    const fetchExecutions = async () => {
      loading.value = true
      const response =
        await AutomationService.listAutomationExecutions(
          props.webhook.id,
          'createdAt_DESC',
          limit,
          offset
        )
      loading.value = false
      if (response.count < limit.value) {
        noMore.value = true
      } else {
        executions.value.concat(response.rows)
      }
    }

    await fetchExecutions()

    return {
      loading,
      noMore,
      disabled,
      executions,
      fetchExecutions
    }
  },
  methods: {
    translate(key) {
      return i18n(key)
    }
  }
}
</script>

<style lang="scss">
.webhook-executions-drawer {
  .el-drawer__title {
    @apply text-lg text-black font-medium;
  }

  .webhook-header {
    @apply p-3 rounded text-sm;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .webhook-executions-list-wrapper {
    height: 300px;
    text-align: center;
  }
  .webhook-executions-list-wrapper .list {
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .webhook-executions-list-wrapper .list-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50px;
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }
  .webhook-executions-list-wrapper .list-item + .list-item {
    margin-top: 10px;
  }
}
</style>
