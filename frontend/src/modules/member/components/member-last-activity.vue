<template>
  <div class="flex flex-col gap-1">
    <div class="flex gap-2 items-center">
      <el-tooltip
        effect="dark"
        :content="platform?.name || member.lastActivity.platform"
        class="text-gray-400"
        placement="top"
      >
        <img
          v-if="platform"
          :alt="platform.name"
          class="w-4 h-4"
          :src="platform.image"
        />
        <i
          v-else
          class="ri-radar-line text-base"
        />
      </el-tooltip>
      <div v-if="member.lastActivity?.display?.short" class="font-medium text-gray-900">
        {{ toSentenceCase(member.lastActivity.display.short) }}
      </div>
    </div>
    <div class="text-gray-500 text-xs ml-6">
      {{ timeAgo }}
    </div>
  </div>
</template>

<script>
import { formatDateToTimeAgo } from '@/utils/date';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { toSentenceCase } from '@/utils/string';

export default {
  name: 'AppMemberLastActivity',
  props: {
    member: {
      type: Object,
      default: () => {},
    },
  },
  computed: {
    platform() {
      return CrowdIntegrations.getConfig(
        this.member.lastActivity.platform,
      );
    },
    timeAgo() {
      return formatDateToTimeAgo(
        this.member.lastActivity.timestamp,
      );
    },
  },
  methods: {
    toSentenceCase,
  },
};
</script>

<style lang="scss">
.member-engagement-level-wrapper {
  @apply relative;

  .app-page-spinner {
    min-height: unset;
  }
}
</style>
