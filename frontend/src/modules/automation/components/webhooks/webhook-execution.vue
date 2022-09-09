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
    <div
      v-if="execution.state === 'error'"
      class="vjs-tree-wrapper vjs-tree-wrapper--error mt-6"
    >
      <span
        class="font-semibold block text-sm text-red-900 mb-4"
      >
        {{ execution.error.message }}
      </span>
      <vue-json-pretty
        v-if="execution.error.body"
        :data="execution.error.body"
        :show-double-quotes="false"
        :show-line="false"
      />
    </div>

    <span class="font-semibold block text-sm mb-1 mt-6"
      >Payload</span
    >
    <div class="vjs-tree-wrapper">
      <vue-json-pretty
        :data="execution.payload"
        :show-double-quotes="false"
        :show-line="false"
      />
    </div>
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
  .vjs-tree-wrapper {
    @apply p-4 rounded overflow-auto;
    background: #f1f5f9;
    height: 430px;

    &--error {
      background: #f9f1f1;
      height: auto;
      max-height: 150px;
      .vjs-tree {
        &.is-highlight,
        .vjs-tree-node:hover {
          @apply bg-red-50;
        }
      }
    }

    .vjs-tree {
      &.is-highlight,
      .vjs-tree-node:hover {
        background: #f8fafc;
      }
    }
  }
}
</style>
