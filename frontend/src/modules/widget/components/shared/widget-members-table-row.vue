<template>
  <div
    class="flex gap-3 items-center col-span-3"
  >
    <app-avatar :entity="member" size="sm" />
    <div class="flex flex-col">
      <span class="font-medium text-xs text-gray-900" v-html="$sanitize(member.displayName)" />
      <span
        v-if="isDetailedView && showActiveDays"
        class="text-gray-500 text-2xs italic"
      >{{
        pluralize('day', member.activeDaysCount, true)
      }}
        active</span>
      <span
        v-else-if="
          member.organizations?.length
            && !isDetailedView
        "
        class="text-gray-500 text-2xs"
      >{{ member.organizations?.[0]?.name }}</span>
    </div>
  </div>

  <div
    v-if="!isDetailedView"
    class="text-xs text-gray-500 italic flex items-center col-span-2"
  >
    {{ member.activeDaysCount }} days active
  </div>

  <div
    class="flex gap-3 items-center col-span-2"
    :class="{
      'col-span-3': isDetailedView,
    }"
  >
    <app-identities-horizontal-list-members
      :member="member"
      :limit="4"
      :as-svg="true"
    />
  </div>

  <div
    class="inline-flex items-center justify-end mr-4 invisible group-hover:visible font-medium text-2xs text-gray-600 gap-1 col-start-8"
  >
    <span v-if="!isDetailedView">Profile</span>
    <i class="ri-arrow-right-s-line" />
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import pluralize from 'pluralize';
import AppIdentitiesHorizontalListMembers from '@/shared/modules/identities/components/identities-horizontal-list-members.vue';

defineProps({
  member: {
    type: Object,
    default: () => {},
    required: true,
  },
  isDetailedView: {
    type: Boolean,
    default: false,
  },
  showActiveDays: {
    type: Boolean,
    default: false,
  },
});
</script>

<script>
export default {
  name: 'AppWidgetTable',
};
</script>
