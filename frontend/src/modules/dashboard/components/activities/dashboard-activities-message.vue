<template>
  <!-- discord, slack -->
  <template
    v-if="['discord', 'slack'].includes(activity.platform)"
  >
    <a
      :href="activity.url"
      target="_blank"
      class="text-gray-900"
    >
      <app-i18n
        :code="computedMessage"
        :args="computedArgs"
        :fallback="'entities.activity.fallback'"
      ></app-i18n>
    </a>
    <span
      v-if="
        [
          'message',
          'file_share',
          'channel_joined',
          'channel_left',
          'reaction_added'
        ].includes(activity.type) && !short
      "
      class="block ml-1"
    >
      <span class="text-gray-900">{{
        ['channel_joined', 'channel_left'].includes(
          activity.type
        )
          ? ''
          : 'in channel'
      }}</span>
      <span class="text-red"> #{{ activity.channel }}</span>
    </span>
  </template>
  <!-- devto -->
  <template v-else-if="activity.platform === 'devto'">
    <a
      :href="activity.url"
      target="_blank"
      class="text-red"
    >
      <app-i18n
        code="entities.activity.devto.commented"
        :args="computedArgs"
        :fallback="'entities.activity.fallback'"
      ></app-i18n>
    </a>
    <span> on a </span>
    <app-i18n
      code="entities.activity.devto.post"
      :args="computedArgs"
      :fallback="'entities.activity.fallback'"
    ></app-i18n
    >&nbsp;<a
      v-if="!short"
      :href="activity.attributes.articleUrl"
      class="text-red"
      target="_blank"
    >
      {{ activity.attributes.articleTitle }}
    </a>
  </template>
  <!-- github -->
  <template v-else-if="activity.platform === 'github'">
    <a
      :href="activity.url"
      target="_blank"
      class="text-gray-900"
    >
      <app-i18n
        :code="computedMessage"
        :args="computedArgs"
        :fallback="'entities.activity.fallback'"
      ></app-i18n>
    </a>
    <div class="flex items-center">
      <span
        v-if="
          !['fork', 'star', 'unstar'].includes(
            activity.type
          ) && !short
        "
        class="ml-1"
        >in</span
      >
      <a
        v-if="!short"
        :href="activity.attributes.repo"
        target="_blank"
        class="ml-1 text-red"
      >
        {{ getRepositoryName(activity.attributes.repo) }}
      </a>
    </div>
  </template>
  <!-- other -->
  <template v-else>
    <a
      v-if="!short"
      :href="activity.url"
      target="_blank"
      class="text-gray-900"
    >
      <app-i18n
        :code="computedMessage"
        :args="computedArgs"
        :fallback="'entities.activity.fallback'"
      ></app-i18n>
    </a>
  </template>
</template>

<script>
import AppI18n from '@/shared/i18n/i18n'
import {
  computedMessage,
  computedArgs
} from '@/modules/activity/activity.helpers'
export default {
  name: 'AppDashboardActivitiesMessage',
  components: { AppI18n },
  props: {
    activity: {
      type: Object,
      required: true
    },
    short: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  computed: {
    computedMessage() {
      return computedMessage(this.activity)
    },
    computedArgs() {
      return computedArgs(this.activity)
    }
  },
  methods: {
    getRepositoryName(repositoryUrl) {
      const splittedUrl = repositoryUrl.split('/')
      if (splittedUrl.length > 0) {
        return splittedUrl[splittedUrl.length - 1]
      }
      return ''
    }
  }
}
</script>
