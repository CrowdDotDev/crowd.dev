<template>
  <div
    v-if="isNew || isTeam"
    class="flex items-center gap-1 min-w-fit"
  >
    <el-tooltip
      v-if="isNew"
      placement="top"
      :content="computedTooltipContent('new')"
    >
      <div v-if="isNew" :class="computedBadgeClass('new')">
        New
      </div>
    </el-tooltip>
    <el-tooltip
      v-if="isTeam"
      placement="top"
      :content="computedTooltipContent('team')"
    >
      <div :class="computedBadgeClass('team')">
        Team
      </div>
    </el-tooltip>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import moment from 'moment/moment';

const props = defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const isTeam = computed(() => props.organization.isTeamOrganization);

const isNew = computed(() => (
  moment().diff(
    moment(props.organization.joinedAt),
    'days',
  ) <= 14
));

const computedBadgeClass = (badge) => {
  let classes = 'badge inline-flex uppercase !text-3xs !px-1 !py-0 leading-normal font-semibold';

  if (badge === 'new') {
    classes += ' badge--light-brand';
    if (isTeam.value) {
      classes += ' mr-1';
    }
  } else if (badge === 'team') {
    classes += ' badge--gray-dark';
  }

  return classes;
};

const computedTooltipContent = (tooltip) => {
  if (tooltip === 'new') {
    return `Joined date: ${moment(
      props.organization.joinedAt,
    ).format('MMM DD, YYYY')}`;
  } if (tooltip === 'team') {
    return 'Team config';
  }
  return '';
};
</script>

<script>
export default {
  name: 'AppOrganizationBadge',
};
</script>
