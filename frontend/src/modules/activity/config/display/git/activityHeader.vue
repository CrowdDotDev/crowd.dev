<template>
  <div class="flex items-center gap-2 justify-between">
    <div class="flex flex-wrap items-center gap-1">
      <div class="relative mr-2">
        <app-avatar :entity="activity.member" size="small" />
        <div class="absolute top-[-8px] right-[-8px] z-10 bg-white rounded-full border-white border-2">
          <el-tooltip v-if="platform" effect="dark" :content="platform.name" placement="top">
            <img :alt="platform.name" class="w-3.5 3.5" :src="platform.image" />
          </el-tooltip>
          <i v-else class="ri-radar-line text-base text-gray-400" />
        </div>
      </div>
      <app-member-display-name
        class="flex items-center"
        custom-class="text-xs text-gray-900 font-medium block !text-brand-500"
        :member="activity.member"
        with-link
      />

      <router-link
        v-if="activity.organization"
        :to="{
          name: 'organizationView',
          params: {
            id: activity.organization.id,
          },
          query: {
            projectGroup: selectedProjectGroup?.id,
            segmentId,
          },
        }"
        class="group hover:cursor-pointer"
      >
        <div
          class="flex items-center gap-1.5 rounded-md border border-gray-200 box-content pr-1.5 pl-0.5 h-5"
          :class="{
            'pl-0.5': activity.organization.logo,
            'pl-1.5': !activity.organization.logo,
          }"
        >
          <img
            v-if="activity.organization.logo"
            class="w-4 h-4 border border-gray-100 rounded-[4px]"
            :src="activity.organization.logo"
            :alt="`${activity.organization.displayName} logo`"
          />
          <span class="text-gray-900 group-hover:text-brand-500 transition text-xs">{{ activity.organization.displayName
          }}</span>
        </div>
      </router-link>

      <div class="activity-message text-xs font-medium" v-html="$sanitize(activityMessage)" />
    </div>

    <div class="flex items-center gap-3">
      <div class="text-xs text-gray-500">
        {{ timeAgo }}
      </div>
      <app-activity-dropdown
        :show-affiliations="false"
        :activity="activity"
        @edit="emit('edit')"
        @on-update="emit('onUpdate')"
        @activity-destroyed="emit('activity-destroyed')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Activity } from '@/shared/modules/activity/types/Activity';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppMemberDisplayName from '@/modules/member/components/member-display-name.vue';
import { computed } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { useActivityStore } from '@/modules/activity/store/pinia';
import AppActivityDropdown from '@/modules/activity/components/activity-dropdown.vue';
import { formatDateToTimeAgo } from '@/utils/date';

const emit = defineEmits<{(e: 'edit'): void,
  (e: 'onUpdate'): void,
  (e: 'activity-destroyed'): void
}>();
const props = defineProps<{
  activity: Activity
}>();

const platform = computed(() => CrowdIntegrations.getConfig(
  props.activity.platform,
));

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const activityStore = useActivityStore();
const { filters } = storeToRefs(activityStore);

const segmentId = computed(() => {
  if (!filters.value.projects) {
    return selectedProjectGroup.value?.id;
  }

  return filters.value.projects.value[0];
});

const activityMessage = computed(() => props.activity.display?.default ?? '');
const timeAgo = computed(() => formatDateToTimeAgo(props.activity.timestamp));
// TBD:
// const sentiment = computed(() => props.activity?.sentiment?.sentiment || 0);
</script>

<style lang="scss">
.activity-message {
  * {
    @apply inline-block align-bottom;
  }

  a,
  span {
    @apply text-brand-500;

    &.gray {
      @apply text-gray-500;
    }

    &:not(.notruncate) {
      @apply truncate max-w-2xs;
    }
  }

  img {
    @apply h-4 w-auto;
  }
}
</style>
