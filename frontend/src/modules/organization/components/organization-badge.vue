<template>
  <div
    v-if="isTeam"
    class="inline-flex items-center gap-1 min-w-fit"
  >
    <el-tooltip
      placement="top"
      content="Your own organization"
    >
      <div class="px-2 py-0.5 flex items-center text-2xs font-medium bg-gray-200 text-gray-600 rounded-md gap-1">
        <lf-icon name="people-group" :size="12" />Team
      </div>
    </el-tooltip>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

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
