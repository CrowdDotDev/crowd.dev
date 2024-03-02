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
