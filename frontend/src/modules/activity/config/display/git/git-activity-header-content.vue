<template>
  <div class="flex items-end gap-2 justify-between">
    <div class="flex items-center gap-2">
      <!-- Avatar -->
      <app-avatar :entity="activity.member" size="xs" />

      <div class="flex flex-col">
        <!-- Display name -->
        <app-member-display-name
          class="flex items-center"
          custom-class="text-xs text-gray-900 font-medium block"
          :member="activity.member"
          with-link
        />
        <div class="flex flex-wrap items-center">
          <!-- Platform icon -->
          <div class="mr-1.5">
            <el-tooltip
              v-if="platform"
              effect="dark"
              :content="platform.name"
              placement="top"
            >
              <img
                :alt="platform.name"
                class="min-w-3.5 h-3.5"
                :src="platform.image"
              />
            </el-tooltip>
            <lf-icon v-else name="satellite-dish" :size="16" class="text-gray-500" />
          </div>

          <div
            class="activity-message text-xs font-medium"
            v-html="$sanitize(toSentenceCase(activityMessage))"
          />

          <span v-if="activity.organization" class="text-gray-500">・</span>

          <!-- Organization -->
          <lf-activity-member-organization :organization="activity.organization" />

          <span class="text-gray-500">・</span>

          <!-- Timestamp -->
          <div class="text-xs text-gray-500">
            {{ timeAgo }}
          </div>

          <span v-if="sentiment" class="text-gray-500">・</span>

          <!-- Sentiment -->
          <app-activity-sentiment
            v-if="sentiment"
            :sentiment="sentiment"
          />
        </div>
      </div>
    </div>

    <!-- Activity actions -->
    <div class="flex items-center gap-3">
      <app-activity-dropdown
        :show-affiliations="inProfile"
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
import AppActivityDropdown from '@/modules/activity/components/activity-dropdown.vue';
import { formatDateToTimeAgo } from '@/utils/date';
import LfActivityMemberOrganization from '@/shared/modules/activity/components/activity-member-organization.vue';
import AppActivitySentiment from '@/modules/activity/components/activity-sentiment.vue';
import { toSentenceCase } from '@/utils/string';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import { lfIdentities } from '@/config/identities';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const emit = defineEmits<{(e: 'edit'): void;
  (e: 'onUpdate'): void;
  (e: 'activity-destroyed'): void;
}>();
const props = defineProps<{
  activity: Activity;
  inProfile?: boolean;
  inDashboard?: boolean;
}>();

const { trackEvent } = useProductTracking();

const platform = computed(() => lfIdentities[props.activity.platform]);

const activityMessage = computed(() => props.activity.display?.default ?? '');
const timeAgo = computed(() => formatDateToTimeAgo(props.activity.timestamp));
const sentiment = computed(() => props.activity?.sentiment?.sentiment || 0);

</script>

<style lang="scss">
.activity-message {
  * {
    @apply inline-block align-bottom;
  }

  a,
  span {
    @apply text-primary-500;

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
