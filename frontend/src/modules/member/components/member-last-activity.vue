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

.member-engagement-level {
  @apply inline-flex items-center text-xs leading-none bg-gray-600 pr-1.5 border-0 gap-1.5 rounded-md text-gray-900;

  &-value {
    @apply font-semibold rounded-tl-md rounded-bl-md h-6 w-6 flex items-center justify-center;
  }

  &--silent {
    @apply bg-red-100;

    .member-engagement-level-value {
      @apply bg-red-200;
    }
  }

  &--quiet {
    @apply bg-yellow-100;

    .member-engagement-level-value {
      @apply bg-yellow-200;
    }
  }

  &--engaged {
    @apply bg-green-100;

    .member-engagement-level-value {
      @apply bg-green-200;
    }
  }

  &--fan {
    @apply bg-purple-100;

    .member-engagement-level-value {
      @apply bg-purple-200;
    }
  }

  &--ultra {
    @apply bg-blue-100;

    .member-engagement-level-value {
      @apply bg-blue-200;
    }
  }
}
</style>
