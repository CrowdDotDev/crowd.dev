<template>
  <div class="webhook-execution px-6 pb-6">
    <div class="flex items-center">
      <div
        :class="
          execution.state === 'success'
            ? 'text-green-500'
            : 'text-red-500'
        "
        class="flex items-center"
      >
        <i
          :class="
            execution.state === 'success'
              ? 'ri-checkbox-circle-line'
              : 'ri-close-circle-line'
          "
          class="mr-1 text-lg"
        />
        <span class="font-medium text-sm">{{
          execution.state === 'success'
            ? 'Success'
            : 'Error'
        }}
        </span>
      </div>
      <div class="text-gray-500 ml-6 text-sm">
        Timestamp:
      </div>
      <div class="text-gray-900 ml-2 text-sm">
        {{ formattedDate(execution.executedAt) }}
      </div>
    </div>
    <div
      v-if="execution.state === 'error'"
      class="vjs-tree-wrapper vjs-tree-wrapper--error mt-6"
    >
      <span
        class="font-medium block text-sm text-red-500 mb-4"
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

    <span class="font-semibold block text-base mb-3 mt-8">Payload</span>
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
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import moment from 'moment';

export default {
  name: 'AppWebhookExecution',
  components: {
    VueJsonPretty,
  },
  props: {
    execution: {
      type: Object,
      default: () => {},
    },
  },
  methods: {
    formattedDate(date) {
      return moment(date).format('YYYY-MM-DD HH:mm:ss');
    },
  },
};
</script>

<style lang="scss">
.webhook-execution {
  .vjs-tree-wrapper {
    @apply p-4 rounded-md overflow-auto bg-gray-50;
    height: 430px;

    .vjs-tree {
      @apply text-xs;

      &.is-highlight,
      .vjs-tree-node:hover {
        @apply bg-gray-100;
      }
    }

    &--error {
      @apply bg-red-50;
      height: auto;
      max-height: 200px;
      .vjs-tree {
        &.is-highlight,
        .vjs-tree-node:hover {
          @apply bg-red-100;
        }
      }
    }
  }

  .vjs-value {
    &-string,
    &-boolean,
    &-number,
    &-array {
      @apply text-gray-900;
    }
  }

  .vjs-key {
    @apply text-gray-500;
  }
}
</style>
