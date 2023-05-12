<template>
  <article v-if="loading || !activity">
    <div class="flex items-center">
      <app-loading height="32px" width="32px" radius="50%" />
      <div class="flex-grow pl-3">
        <app-loading height="12px" width="400px" />
      </div>
    </div>
  </article>
  <article v-else>
    <div class="flex">
      <div class="flex flex-col items-center pt-1">
        <app-avatar :entity="member" size="xs">
          <template #icon>
            <app-activity-icon
              :type="platform?.activityDisplay?.typeIcon || activity.type"
              :platform="activity.platform"
            />
          </template>
        </app-avatar>
        <slot name="underAvatar" />
      </div>
      <div class="flex-grow pl-3" :class="bodyClasses">
        <div class="flex items-center h-5">
          <p class="text-2xs leading-5 text-gray-500 flex items-center">
            <app-member-display-name
              class="inline-flex items-center"
              custom-class="text-gray-500"
              :member="member"
              with-link
            />
            <span class="mx-1">·</span>
            <span>{{ timeAgo(activity.timestamp) }}</span>
            <span v-if="sentiment" class="mx-1">·</span>
          </p>
          <app-activity-sentiment v-if="sentiment" :sentiment="sentiment" />
        </div>
        <div>
          <app-activity-content
            :activity="activity"
            :display-thread="false"
            :display-title="false"
            :display-title-body="displayTitleBody"
            class="text-sm"
            :class="{
              'line-clamp-1': !displayContent && !showMore,
            }"
            :show-more="showMore"
            :limit="limit"
          >
            <template v-if="platform?.activityDisplay?.showContentDetails && activity.attributes" #details>
              <app-conversation-reply-attributes
                :changes="activity.attributes.lines"
                changes-copy="line"
                :insertions="activity.attributes.insertions"
                :deletions="activity.attributes.deletions"
              />
            </template>
          </app-activity-content>
        </div>
      </div>
    </div>
  </article>
</template>

<script>
import { formatDateToTimeAgo } from '@/utils/date';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import AppMemberDisplayName from '@/modules/member/components/member-display-name.vue';
import AppActivityContent from '@/modules/activity/components/activity-content.vue';
import AppActivitySentiment from '@/modules/activity/components/activity-sentiment.vue';
import AppActivityIcon from '@/modules/activity/components/activity-icon.vue';
import pluralize from 'pluralize';
import AppConversationReplyAttributes from '@/modules/conversation/components/conversation-reply-attributes.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';

export default {
  name: 'AppConversationReply',
  components: {
    AppMemberDisplayName,
    AppActivityContent,
    AppActivitySentiment,
    AppLoading,
    AppAvatar,
    AppActivityIcon,
    AppConversationReplyAttributes,
  },
  props: {
    activity: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
    bodyClasses: {
      type: String,
      required: false,
      default: '',
    },
    displayContent: {
      type: Boolean,
      required: false,
      default: false,
    },
    showMore: {
      type: Boolean,
      required: false,
      default: false,
    },
    limit: {
      type: Number,
      required: false,
      default: 4,
    },
  },
  computed: {
    member() {
      return this.activity.member;
    },
    sentiment() {
      if (
        this.activity
        && this.activity.sentiment
        && this.activity.sentiment.sentiment
      ) {
        return this.activity.sentiment.sentiment;
      }
      return 0;
    },
    platform() {
      return CrowdIntegrations.getConfig(
        this.activity.platform,
      );
    },
    // Show activity for activity types coming from git
    // and comment on PR reviews from github
    displayTitleBody() {
      return (
        this.activity.type === 'pull_request-review-thread-comment'
        || this.activity.type.includes('commit')
      );
    },
  },
  methods: {
    timeAgo(date) {
      return formatDateToTimeAgo(date);
    },
    pluralize,
  },
};
</script>
