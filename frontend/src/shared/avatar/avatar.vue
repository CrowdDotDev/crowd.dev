<template>
  <div
    v-if="entity"
    class="avatar"
    :class="computedClass"
    :style="computedStyle"
  >
    <span
      v-if="
        !entity.attributes?.avatarUrl?.default
          && !entity.avatar
      "
      class="font-semibold uppercase"
    >{{ computedInitials }}</span>
  </div>
</template>

<script>
export default {
  name: 'AppAvatar',
  props: {
    entity: {
      type: Object,
      default: () => {},
    },
    size: {
      type: String,
      default: 'md',
    },
  },
  data() {
    return {
      backgroundColors: ['#FDEDEA'],
      textColors: ['#BA3F25'],
    };
  },
  computed: {
    computedBackgroundColor() {
      return this.backgroundColors[
        (this.entity.displayName || '').length
          % this.backgroundColors.length
      ];
    },
    computedTextColor() {
      return this.textColors[
        (this.entity.displayName || '').length
          % this.textColors.length
      ];
    },
    computedStyle() {
      const url = this.entity.avatar
        ? this.entity.avatar
        : this.entity.attributes?.avatarUrl?.default || null;
      return url
        ? `background-image: url(${url})`
        : {
          backgroundColor: this.computedBackgroundColor,
          borderColor: this.computedBackgroundColor,
          color: this.computedTextColor,
        };
    },
    computedClass() {
      return `avatar--${this.size}`;
    },
    computedInitials() {
      const names = (
        this.entity.displayName
        || this.entity.label
        || ''
      )
        .replace(
          // remove emojis from string
          /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
          '',
        )
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ');

      return names.length > 1
        ? names[0][0] + names[1][0]
        : names[0][0];
    },
  },
};
</script>

<style lang="scss">
.avatar {
  @apply rounded-full h-12 w-12 shrink-0 flex justify-center items-center;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  border: 1px solid #dedede;

  &--xl {
    @apply h-18 w-18 text-xl;
  }

  &--lg {
    @apply h-16 w-16 text-lg;
  }

  &--md {
    @apply h-12 w-12;
  }

  &--sm {
    @apply h-10 w-10;
  }

  &--xs {
    @apply h-8 w-8;
  }

  &--xxs {
    @apply h-5 w-5;

    span {
      @apply text-3xs;
    }
  }
}
</style>
