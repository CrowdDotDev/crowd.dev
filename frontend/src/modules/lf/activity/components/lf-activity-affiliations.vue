<template>
  <div v-if="showAffiliations">
    <div class="uppercase text-gray-400 text-2xs font-semibold tracking-wide px-3 pt-1.5 pb-4">
      Activity Affiliation
    </div>
    <div class="flex flex-col gap-1">
      <el-dropdown-item
        v-for="organization in organizations"
        :key="organization.id"
        class="h-10 !px-3 !mb-0 flex justify-between"
        :class="{
          'bg-primary-50': organization.id === activity.organizationId,
        }"
        :command="() => editActivity(organization.id)"
      >
        <span class="text-xs">{{ organization.displayName }}</span>
        <lf-icon
          v-if="organization.id === activity.organizationId"
          name="check"
          :size="16"
          class="!text-primary-600"
        />
      </el-dropdown-item>
      <el-dropdown-item
        class="h-10 !px-3 !mb-0 flex gap-4 justify-between"
        :class="{
          'bg-primary-50': !activity.organizationId,
        }"
        :command="() => editActivity(null)"
      >
        <span class="text-xs">Individual / No affiliation</span>
        <lf-icon
          v-if="!activity.organizationId"
          name="check"
          :size="16"
          class="!text-primary-600"
        />
      </el-dropdown-item>
    </div>
    <el-divider class="!my-2.5 border-gray-200" />
  </div>
  <slot name="dropdownItems" />
</template>

<script setup>
import { ActivityService } from '@/modules/activity/activity-service';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import { useRoute } from 'vue-router';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const emit = defineEmits(['onUpdate']);
const props = defineProps({
  activity: {
    type: Object,
    required: true,
  },
  organizations: {
    type: Array,
    default: () => [],
  },
  showAffiliations: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const { trackEvent } = useProductTracking();

const editActivity = (organizationId) => {
  trackEvent({
    key: FeatureEventKey.AFFILIATE_ACTIVITY,
    type: EventType.FEATURE,
    properties: {
      path: route.path,
    },
  });

  ActivityService.update(
    props.activity.id,
    {
      organizationId,
    },
    [props.activity.segmentId],
  ).then(() => {
    emit('onUpdate');
  });
};
</script>

<script>
export default {
  name: 'AppLfActivityAffiliations',
};
</script>
