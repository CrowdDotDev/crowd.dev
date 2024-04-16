<template>
  <div>
    <div class="border-b border-gray-200 px-6 pt-6 pb-8">
      <span class="text-base font-semibold">Commit</span>
      <div v-if="conversation.conversationStarter.title || conversation.conversationStarter.body" class="pt-4">
        <app-activity-content
          v-if="conversation.conversationStarter.body"
          class="text-sm text-gray-600"
          :activity="conversation.conversationStarter"
          :show-more="true"
          :display-thread="false"
        />
      </div>
    </div>

    <div class="px-6 py-8 flex flex-col gap-6">
      <div v-for="activitiesByType in Object.values(activitiesList)" :key="activitiesByType.display.type" class="flex flex-col gap-1">
        <div class="text-xs text-gray-400 font-medium">
          {{ toSentenceCase(activitiesByType.display.author ?? '') }}
        </div>
        <div class="flex flex-col gap-4">
          <div v-for="activity in activitiesByType.activities" :key="activity.id" class="flex items-center gap-2">
            <app-avatar size="xxs" :entity="activity.member" />
            <div class="flex items-center">
              <app-member-display-name
                class="flex items-center"
                custom-class="text-sm text-gray-900 block"
                :member="activity.member"
                with-link
              />
              <span v-if="activity.organization" class="flex items-center">
                <span>・</span>

                <lf-activity-member-organization :organization="activity.organization" />
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
  </div>
</template>

<script setup lang="ts">
import { Conversation } from '@/shared/modules/conversation/types/Conversation';
import AppActivityContent from '@/modules/activity/components/activity-content.vue';
import { computed } from 'vue';
import { Activity } from '@/shared/modules/activity/types/Activity';
import { toSentenceCase } from '@/utils/string';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppMemberDisplayName from '@/modules/member/components/member-display-name.vue';
import { formatDateToTimeAgo } from '@/utils/date';
import LfActivityMemberOrganization from '@/shared/modules/activity/components/activity-member-organization.vue';

const props = defineProps<{
  conversation: Conversation;
}>();

const activitiesList = computed(() => props.conversation.activities.reduce((acc, a) => {
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
}, {} as {
    [key: string]: {
      display: {
        type: string;
        default: string;
        short: string;
        author: string;
        channel: string;
    }
      activities: Activity[];
    }
  }));
</script>
@/shared/modules/conversation/types/Conversation
