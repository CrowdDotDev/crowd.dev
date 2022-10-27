<template>
  <div>
    <div class="flex items-center">
      <el-tooltip
        effect="dark"
        :content="platform.name"
        class="text-gray-400"
        placement="top"
      >
        <span
          class="w-4 h-4 mr-2"
          v-html="svgs[member.lastActivity.platform]"
        ></span>
      </el-tooltip>
      <app-activity-message
        :activity="member.lastActivity"
        :short="true"
      />
    </div>
    <div class="flex items-center">
      <div class="w-4 mr-2"></div>
      <div class="text-gray-500 text-xs">
        {{ timeAgo }}
      </div>
    </div>
  </div>
</template>

<script>
import AppActivityMessage from '@/modules/activity/components/activity-message'
import integrationsJsonArray from '@/jsons/integrations.json'
import computedTimeAgo from '@/utils/time-ago'
import svgs from '@/assets/js/svgs.js'

export default {
  name: 'AppMemberLastActivity',
  components: {
    AppActivityMessage
  },
  props: {
    member: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      svgs
    }
  },
  computed: {
    platform() {
      return integrationsJsonArray.find(
        (i) =>
          i.platform === this.member.lastActivity.platform
      )
    },
    timeAgo() {
      return computedTimeAgo(
        this.member.lastActivity.timestamp
      )
    }
  }
}
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
