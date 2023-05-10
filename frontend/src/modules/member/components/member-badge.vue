<template>
  <div
    v-if="isNew || isTeam || isBot"
    class="member-badge flex items-center ml-1 min-w-fit"
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
    <el-tooltip
      v-if="isBot"
      placement="top"
      :content="computedTooltipContent('bot')"
    >
      <div :class="computedBadgeClass('bot')">
        Bot
      </div>
    </el-tooltip>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import moment from 'moment/moment';

const props = defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const isTeam = computed(() => props.member.attributes.isTeamMember?.default);

const isBot = computed(() => props.member.attributes.isBot?.default);

const isNew = computed(() => (
  moment().diff(moment(props.member.joinedAt), 'days')
    <= 14
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
  } else if (badge === 'bot') {
    classes += ' badge--gray';
  }

  return classes;
};

const computedTooltipContent = (tooltip) => {
  if (tooltip === 'new') {
    return `Member since ${moment(
      props.member.joinedAt,
    ).format('MMM DD, YYYY')}`;
  } if (tooltip === 'team') {
    return 'Team member';
  }
  return 'Bot';
};
</script>

<script>
export default {
  name: 'AppMemberBadge',
};
</script>

<style lang="scss">
.flex > .member-display-name + .member-badge,
.inline-flex > .member-display-name + .member-badge {
  @apply ml-2;
}
</style>
