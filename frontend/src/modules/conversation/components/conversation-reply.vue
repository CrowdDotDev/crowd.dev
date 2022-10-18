<template>
  <article v-if="loading || !activity">
    <div class="flex">
      <app-loading
        height="32px"
        width="32px"
        radius="50%"
      />
      <div class="flex-grow pl-3">
        <div class="flex items-center h-5">
          <app-loading height="16px" width="160px" />
        </div>
        <app-loading
          height="14px"
          width="80%"
        ></app-loading>
      </div>
    </div>
  </article>
  <article v-else>
    <div class="flex">
      <div class="flex flex-col items-center">
        <app-avatar :entity="member" size="xs" />
        <slot name="underAvatar"></slot>
      </div>
      <div class="flex-grow pl-3">
        <div class="flex items-center h-5">
          <p class="text-2xs leading-5 text-gray-500">
            <span>{{ member.displayName }}</span>
            <span class="mx-1">·</span>
            <span>{{ timeAgo(activity.timestamp) }}</span>
            <span class="mx-1">·</span>
          </p>
          <el-tooltip
            effect="dark"
            :content="`Confidence ${sentiment}%`"
            placement="top"
          >
            <i
              v-if="sentiment >= 50"
              class="ri-emotion-happy-line text-green-600 text-base"
            ></i>
            <i
              v-else
              class="ri-emotion-unhappy-line text-red-500 text-base"
            ></i>
          </el-tooltip>
        </div>
        <div
          class="text-xs leading-5 h-5 text-ellipsis overflow-hidden"
        >
          <app-activity-content
            :activity="activity"
            class="text-sm"
          />
        </div>
      </div>
    </div>
  </article>
</template>

<script>
import AppAvatar from '@/shared/avatar/avatar'
import computedTimeAgo from '@/utils/time-ago'
import AppLoading from '@/shared/loading/loading-placeholder'
import AppActivityContent from '@/modules/activity/components/activity-content'

export default {
  name: 'AppConversationReply',
  components: {
    AppActivityContent,
    AppLoading,
    AppAvatar
  },
  props: {
    activity: {
      type: Object,
      required: false,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  computed: {
    member() {
      return this.activity.member
    },
    sentiment() {
      return this.activity.sentiment.sentiment
    }
  },
  methods: {
    timeAgo(date) {
      return computedTimeAgo(date)
    }
  }
}
</script>
