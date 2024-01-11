<template>
  <div>
    <div class="flex gap-2 items-center">
      <el-tooltip
        effect="dark"
        :content="platform?.name || member.lastActivity.platform"
        class="text-gray-400"
        placement="top"
      >
        <i
          v-if="!platform"
          class="ri-radar-line text-base"
        />
        <app-svg
          v-else
          :name="member.lastActivity.platform"
          class="w-4 h-4"
        />
      </el-tooltip>
      <app-activity-message
        :activity="member.lastActivity"
        type="short"
      />
    </div>
    <div class="flex items-center">
      <div class="w-4 mr-2" />
      <div class="text-gray-500 text-xs">
        {{ timeAgo }}
      </div>
    </div>
  </div>
</template>

<script>
import { formatDateToTimeAgo } from '@/utils/date';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppActivityMessage from '@/modules/activity/components/activity-message.vue';
import AppSvg from '@/shared/svg/svg.vue';

export default {
  name: 'AppMemberLastActivity',
  components: {
    AppActivityMessage,
    AppSvg,
  },
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
