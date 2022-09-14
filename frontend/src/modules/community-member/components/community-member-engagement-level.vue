<template>
  <div class="community-member-engagement-level-wrapper">
    <div v-if="member.crowdInfo.team" class="">
      <div class="font-semibold text-gray-400">
        Team member
      </div>
    </div>
    <div v-else>
      <div
        v-if="computedEngagementLevel.value === -1"
        class="inline-flex items-center justify-center tag"
      >
        <span
          class="block mr-2 text-xs font-semibold text-gray-400"
          >Computing</span
        >
        <div
          v-loading="true"
          class="app-page-spinner h-6 w-6"
        ></div>
      </div>
      <div
        v-else
        class="tag community-member-engagement-level"
        :class="`community-member-engagement-level--${computedEngagementLevel.label.toLowerCase()}`"
      >
        <span
          class="community-member-engagement-level-label"
        >
          {{ computedEngagementLevel.label }}
        </span>

        <span
          class="community-member-engagement-level-value"
        >
          {{ Math.round(computedEngagementLevel.value) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppCommunityEngagementLevel',
  props: {
    member: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    computedEngagementLevel() {
      const value = this.member.score
      let label = ''

      if (value <= 1) {
        label = 'Silent'
      } else if (value <= 3) {
        label = 'Quiet'
      } else if (value <= 6) {
        label = 'Engaged'
      } else if (value <= 8) {
        label = 'Fan'
      } else if (value <= 10) {
        label = 'Ultra'
      }

      return {
        value,
        label
      }
    }
  }
}
</script>

<style lang="scss">
.community-member-engagement-level-wrapper {
  @apply relative;

  .app-page-spinner {
    min-height: unset;
  }
}

.community-member-engagement-level {
  @apply inline-flex items-center text-sm leading-none bg-gray-600 px-3 text-black font-semibold border-0;

  &-value {
    @apply text-xs h-4 w-6 rounded-md flex items-center justify-center ml-2;
  }

  &--silent {
    @apply bg-red-50 border-red-500;

    .community-member-engagement-level-value {
      @apply bg-red-500 text-white;
    }
  }

  &--quiet {
    @apply bg-yellow-50 border-yellow-500;

    .community-member-engagement-level-value {
      @apply bg-yellow-500 text-white;
    }
  }

  &--engaged {
    @apply bg-green-50 border-green-500;

    .community-member-engagement-level-value {
      @apply bg-green-500 text-white;
    }
  }

  &--fan {
    @apply bg-teal-50 border-teal-500;

    .community-member-engagement-level-value {
      @apply bg-teal-500 text-white;
    }
  }

  &--ultra {
    @apply bg-blue-50 border-blue-500;

    .community-member-engagement-level-value {
      @apply bg-blue-500 text-white;
    }
    /*background: rgba(0, 165, 175, 0.1);
    border: 1px solid rgba(0, 165, 175, 0.5);

    .community-member-engagement-level-value {
      @apply text-white;
      background: #00a5af;
    } */
  }
}
</style>
