<template>
  <div class="webhook-execution">
    <div class="flex items-center">
      <div
        :class="
          execution.state === 'success'
            ? 'text-green-900'
            : 'text-red-900'
        "
        class="flex items-center"
      >
        <i
          :class="
            execution.state === 'success'
              ? 'ri-checkbox-circle-line'
              : 'ri-close-circle-line'
          "
          class="mr-2"
        />
        <span
          >{{
            execution.state === 'success'
              ? 'Success'
              : 'Error'
          }}
        </span>
      </div>
      <div class="text-gray-600 ml-6">Timestamp:</div>
      <div class="text-gray-900 ml-1">
        {{ formattedDate(execution.executedAt) }}
      </div>
    </div>
    <vue-json-pretty
      :data="execution.payload"
      :show-double-quotes="false"
      :show-line="false"
    />
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'
import moment from 'moment'

export default {
  name: 'AppWebhookExecution',
  components: {
    VueJsonPretty
  },
  props: {
    execution: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    formattedDate(date) {
      return moment(date).format('YYYY-MM-DD HH:mm:ss')
    }
  }
}
</script>

<style lang="scss">
.webhook-execution {
  .vjs-tree {
    @apply p-4 rounded mt-6 overflow-auto;
    background: #f1f5f9;
    height: 430px;
  }
}
</style>
