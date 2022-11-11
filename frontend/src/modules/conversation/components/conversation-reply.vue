<template>
  <article v-if="loading || !activity">
    <div class="flex items-center">
      <app-loading
        height="32px"
        width="32px"
        radius="50%"
      />
      <div class="flex-grow pl-3">
        <app-loading height="12px" width="400px" />
      </div>
    </div>
  </article>
  <article v-else>
    <div class="flex">
      <div class="flex flex-col items-center">
        <app-avatar :entity="member" size="xs" />
        <slot name="underAvatar"></slot>
      </div>
      <div class="flex-grow pl-3" :class="bodyClasses">
        <div class="flex items-center h-5">
          <p
            class="text-2xs leading-5 text-gray-500 flex items-center"
          >
            <app-member-display-name
              class="inline-flex items-center"
              custom-class="mr-2"
              :member="member"
            />
            <span class="mx-1">·</span>
            <span>{{ timeAgo(activity.timestamp) }}</span>
            <span class="mx-1">·</span>
          </p>
          <app-activity-sentiment
            v-if="sentiment"
            :sentiment="sentiment"
          />
        </div>
        <div>
          <app-activity-content
            :activity="activity"
            :display-thread="false"
            :display-title="false"
            class="text-sm"
            :class="{
              'text-limit-1': !displayContent && !showMore
            }"
            :show-more="showMore"
            :limit="limit"
          />
        </div>
      </div>
    </div>
  </article>
</template>

<script>
import AppAvatar from '@/shared/avatar/avatar'
import { formatDateToTimeAgo } from '@/utils/date'
import AppLoading from '@/shared/loading/loading-placeholder'
import AppMemberDisplayName from '@/modules/member/components/member-display-name'
import AppActivityContent from '@/modules/activity/components/activity-content'
import AppActivitySentiment from '@/modules/activity/components/activity-sentiment'

export default {
  name: 'AppConversationReply',
  components: {
    AppMemberDisplayName,
    AppActivityContent,
    AppActivitySentiment,
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
    },
    bodyClasses: {
      type: String,
      required: false,
      default: ''
    },
    displayContent: {
      type: Boolean,
      required: false,
      default: false
    },
    showMore: {
      type: Boolean,
      required: false,
      default: false
    },
    limit: {
      type: Number,
      required: false,
      default: 4
    }
  },
  computed: {
    member() {
      return this.activity.member
    },
    sentiment() {
      if (
        this.activity &&
        this.activity.sentiment &&
        this.activity.sentiment.sentiment
      ) {
        return this.activity.sentiment.sentiment
      }
      return 0
    }
  },
  methods: {
    timeAgo(date) {
      return formatDateToTimeAgo(date)
    }
  }
}
</script>
