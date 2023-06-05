<template>
  <div class="member-engagement-level-wrapper">
    <div class="leading-none">
      <div
        v-if="computedEngagementLevel.value === -1"
        class="inline-flex items-center justify-center"
      >
        <span
          class="block mr-2 text-xs font-semibold text-gray-400"
        >Computing</span>
      </div>
      <div
        v-else-if="member.attributes.isTeamMember?.crowd"
      >
        <span
          class="block mr-2 text-xs font-semibold text-gray-500"
        >-</span>
      </div>
      <div
        v-else
        class="member-engagement-level"
        :class="`member-engagement-level--${computedEngagementLevel.label.toLowerCase()}`"
      >
        <span class="member-engagement-level-value">
          {{ Math.round(computedEngagementLevel.value) }}
        </span>

        <span class="member-engagement-level-label" data-qa="member-engagement-level-label">
          {{ computedEngagementLevel.label }}
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
      default: () => {},
    },
  },
  computed: {
    computedEngagementLevel() {
      const value = this.member.score;
      let label = '';

      if (value <= 1) {
        label = 'Silent';
      } else if (value <= 3) {
        label = 'Quiet';
      } else if (value <= 6) {
        label = 'Engaged';
      } else if (value <= 8) {
        label = 'Fan';
      } else if (value <= 10) {
        label = 'Ultra';
      }

      return {
        value,
        label,
      };
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
