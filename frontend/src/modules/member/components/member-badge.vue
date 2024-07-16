<template>
  <div
    v-if="isTeam || isBot"
    class="member-badge flex items-center ml-1 min-w-fit"
  >
    <el-tooltip
      v-if="isTeam"
      placement="top"
      :content="computedTooltipContent('team')"
    >
      <div class="inline-flex text-2xs px-1 font-medium text-white rounded h-4 items-center justify-center bg-gray-400">
        Team
      </div>
    </el-tooltip>
    <el-tooltip
      v-if="isBot"
      placement="top"
      :content="computedTooltipContent('bot')"
    >
      <div class="inline-flex text-2xs px-1 font-medium text-white rounded h-4 items-center justify-center bg-gray-400">
        Bot
      </div>
    </el-tooltip>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const isTeam = computed(() => props.member.attributes.isTeamMember?.default);

const isBot = computed(() => props.member.attributes.isBot?.default);

const computedTooltipContent = (tooltip) => {
  if (tooltip === 'team') {
    return 'This person belongs to your organization';
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
