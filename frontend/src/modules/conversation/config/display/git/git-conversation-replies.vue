<template>
  <div class="pb-10">
    <div
      v-for="activitiesByType in Object.values(activitiesList)"
      :key="activitiesByType.display.type"
      class="flex flex-col gap-1"
    >
      <div class="text-xs text-gray-400 font-medium">
        {{ toSentenceCase(activitiesByType.display.author ?? "") }}
      </div>
      <div class="flex flex-col gap-4">
        <div
          v-for="activity in activitiesByType.activities"
          :key="activity.id"
          class="flex items-center gap-2"
        >
          <app-avatar size="xxs" :entity="activity.member" />
          <div class="flex items-center">
            <app-member-display-name
              class="flex items-center"
              custom-class="text-sm text-gray-900 block"
              :member="activity.member"
              with-link
            />
            <span v-if="activity.organization">
              <span>・</span>

              <lf-activity-member-organization
                :organization="activity.organization"
              />
            </span>

            <span class="text-sm text-gray-500">
              <span>・</span>
              {{ formatDateToTimeAgo(activity.timestamp) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    class="-mx-6 -mb-6 px-6 py-4 flex items-center justify-between bg-gray-50 whitespace-nowrap"
  >
    <div class="flex items-center gap-8 w-9/12">
      <div class="flex items-center">
        <lf-icon name="user-group" :size="16" class="text-gray-500 mr-2" />
        <p class="text-xs text-gray-600">
          {{ pluralize("participant", conversation.memberCount, true) }}
        </p>
      </div>
      <app-conversation-attributes
        v-if="attributes"
        :changes="attributes.lines"
        changes-copy="line"
        :insertions="attributes.insertions"
        :deletions="attributes.deletions"
        :source-id="sourceId"
        display-source-id
      />
    </div>
    <div>
      <lf-git-activity-link :activity="conversation.conversationStarter" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Activity } from '@/shared/modules/activity/types/Activity';
import { toSentenceCase } from '@/utils/string';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppMemberDisplayName from '@/modules/member/components/member-display-name.vue';
import { formatDateToTimeAgo } from '@/utils/date';
import LfActivityMemberOrganization from '@/shared/modules/activity/components/activity-member-organization.vue';
import AppConversationAttributes from '@/modules/conversation/components/conversation-attributes.vue';
import pluralize from 'pluralize';
import { Conversation } from '@/shared/modules/conversation/types/Conversation';
import LfGitActivityLink from '@/modules/activity/config/display/git/git-activity-link.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps<{
  conversation: Conversation;
}>();

const activitiesList = computed(() => props.conversation.lastReplies.reduce(
  (acc, a) => {
    if (acc[a.type]?.activities?.length) {
      acc[a.type].activities.push(a);
    } else {
      acc[a.type] = {
        display: {
          ...a.display,
          type: a.type,
        },
        activities: [a],
      };
    }

    return acc;
  },
    {} as {
      [key: string]: {
        display: {
          type: string;
          default: string;
          short: string;
          author: string;
          channel: string;
        };
        activities: Activity[];
      };
    },
));

const attributes = computed(
  () => props.conversation.conversationStarter.attributes,
);
const sourceId = computed(() => {
  if (props.conversation.conversationStarter.type === 'authored-commit') {
    return props.conversation.conversationStarter.sourceId;
  }

  return props.conversation.conversationStarter.parent?.sourceId;
});
</script>
@/shared/modules/conversation/types/Conversation
