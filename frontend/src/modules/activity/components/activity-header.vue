<template>
  <div>
    <slot>
      <app-activity-message
        :activity="activity"
      />
    </slot>
    <div class="whitespace-nowrap flex items-center">
      <div v-if="activity.organization" class="flex items-center">
        <span class="mx-1 text-gray-500">·</span>
        <router-link
          :to="{
            name: 'organizationView',
            params: {
              id: activity.organization.id,
            },
          }"
          class="group hover:cursor-pointer"
        >
          <div class="flex items-center gap-1">
            <img
              v-if="activity.organization.logo"
              class="w-3.5 h-3.5"
              :src="activity.organization.logo"
              :alt="`${activity.organization.displayName} logo`"
            />
            <span class="text-gray-900 group-hover:text-brand-500 transition">{{ activity.config.displayName }}</span>
          </div>
        </router-link>
      </div>
      <span class="mx-1 text-gray-500">·</span>
      <span class="text-gray-500">{{ timeAgo }}</span>
    </div>
    <span
      v-if="sentiment"
      class="mx-1"
    >·</span>
    <app-activity-sentiment
      v-if="sentiment"
      :sentiment="sentiment"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import AppActivityMessage from '@/modules/activity/components/activity-message.vue';
import AppActivitySentiment from '@/modules/activity/components/activity-sentiment.vue';
import { formatDateToTimeAgo } from '@/utils/date';

const props = defineProps({
  activity: {
    type: Object,
    default: () => {},
  },
});

const timeAgo = computed(() => formatDateToTimeAgo(props.activity.timestamp));
const sentiment = computed(() => props.activity?.sentiment?.sentiment || 0);
</script>

<script>
export default {
  name: 'AppActivityHeader',
};
</script>
