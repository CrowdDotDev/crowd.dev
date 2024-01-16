<template>
  <div
    v-if="isTeam"
    class="inline-flex items-center gap-1 min-w-fit"
  >
    <el-tooltip
      placement="top"
      content="Your own organization"
    >
      <div class="flex text-2xs px-1 font-medium text-white rounded h-4 items-center justify-center bg-gray-400">
        Team
      </div>
    </el-tooltip>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const isTeam = computed(() => props.organization.isTeamOrganization);
</script>

<script>
export default {
  name: 'AppOrganizationBadge',
};
</script>
