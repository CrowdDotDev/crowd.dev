<template>
  <div>
    <article v-if="loading || !activity">
      <app-loading height="85px" radius="8px" />
    </article>
    <article v-else class="panel">
      <div class="flex">
        <!-- Avatar -->
        <div class="pr-3">
          <router-link
            :to="{
              name: 'memberView',
              params: { id: activity.member.id },
            }"
            target="_blank"
          >
            <app-avatar
              :entity="activity.member"
              size="xs"
            />
          </router-link>
        </div>
        <!-- activity info -->
        <div class="flex-grow">
          <div class="flex justify-between">
            <div>
              <app-member-display-name
                class="flex items-center pb-0.5"
                custom-class="text-2xs leading-4 text-gray-900 font-medium block"
                :member="activity.member"
                with-link
              />
              <div class="flex items-center">
                <div>
                  <!-- platform icon -->
                  <el-tooltip
                    v-if="platform"
                    effect="dark"
                    :content="platform.name"
                    placement="top"
                  >
                    <img
                      :alt="platform.name"
                      class="w-4 h-4"
                      :src="platform.image"
                    />
                  </el-tooltip>
                  <i
                    v-else
                    class="ri-radar-line text-base text-gray-400"
                  />
                </div>
                <p
                  class="text-xs leading-4 pl-2 flex flex-wrap"
                >
                  <!-- activity message -->
                  <app-activity-message
                    :activity="activity"
                  />
                  <!-- activity timestamp -->
                  <span
                    class="whitespace-nowrap text-gray-500"
                  ><span class="mx-1">·</span>{{ timeAgo }}</span>
                  <span
                    v-if="sentiment"
                    class="mx-1"
                  >·</span>
                  <app-activity-sentiment
                    v-if="sentiment"
                    :sentiment="sentiment"
                  />
                </p>
              </div>
            </div>
            <div class="flex items-center">
              <a
                v-if="
                  activity.conversationId
                    && displayConversationLink
                "
                class="text-xs font-medium flex items-center mr-6 cursor-pointer"
                target="_blank"
                @click="
                  openConversation(activity.conversationId)
                "
              ><i
                 class="ri-lg ri-arrow-right-up-line mr-1"
               />
                <span class="block">Open conversation</span></a>
              <app-activity-dropdown
                :activity="activity"
                @edit="$emit('edit')"
                @activity-destroyed="$emit('activity-destroyed')"
              />
            </div>
          </div>
          <!-- member name -->
          <div
            v-if="activity.title || activity.body"
            class="pt-6"
          >
            <app-activity-content
              :activity="activity"
              :display-body="false"
              :display-title="false"
            />
            <app-activity-content
              class="text-sm bg-gray-50 rounded-lg p-4"
              :activity="activity"
              :show-more="true"
              :display-thread="false"
            >
              <template v-if="platform?.activityDisplay?.showContentDetails" #details>
                <div v-if="activity.attributes">
                  <app-activity-content-footer
                    :source-id="activity.sourceId"
                    :changes="activity.attributes.lines"
                    changes-copy="line"
                    :insertions="activity.attributes.insertions"
                    :deletions="activity.attributes.deletions"
                  />
                </div>
              </template>

              <template #bottomLink>
                <div v-if="activity.url" class="pt-6">
                  <app-activity-link
                    :activity="activity"
                  />
                </div>
              </template>
            </app-activity-content>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<script>
import { formatDateToTimeAgo } from '@/utils/date';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppActivityDropdown from '@/modules/activity/components/activity-dropdown.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import AppActivityMessage from '@/modules/activity/components/activity-message.vue';
import AppActivityContent from '@/modules/activity/components/activity-content.vue';
import AppActivityLink from '@/modules/activity/components/activity-link.vue';
import AppActivitySentiment from '@/modules/activity/components/activity-sentiment.vue';
import AppMemberDisplayName from '@/modules/member/components/member-display-name.vue';
import AppActivityContentFooter from '@/modules/activity/components/activity-content-footer.vue';

export default {
  name: 'AppActivityItem',
  components: {
    AppMemberDisplayName,
    AppActivityLink,
    AppActivityContent,
    AppActivityMessage,
    AppLoading,
    AppActivityDropdown,
    AppAvatar,
    AppActivitySentiment,
    AppActivityContentFooter,
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
    displayConversationLink: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  emits: ['openConversation', 'edit', 'activity-destroyed'],
  computed: {
    platform() {
      return CrowdIntegrations.getConfig(
        this.activity.platform,
      );
    },
    timeAgo() {
      return formatDateToTimeAgo(this.activity.timestamp);
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
  },
  methods: {
    openConversation(conversationId) {
      this.$emit('openConversation', conversationId);
    },
  },
};
</script>
