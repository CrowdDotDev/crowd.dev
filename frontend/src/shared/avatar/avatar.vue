<template>
  <div class="relative">
    <div
      v-if="entity"
      class="avatar"
      :style="computedStyle"
      :aria-label="computedInitials"
    >
      <img v-if="url" :src="url" alt="">
    </div>
    <slot name="icon" />
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
      sizes: {
        xl: '4.5rem',
        lg: '4rem',
        md: '3rem',
        sm: '2.5rem',
        xs: '2rem',
        xxs: '1.25rem',
      },
    };
  },
  computed: {
    computedSize() {
      return this.sizes[this.size] ?? this.size;
    },
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
    url() {
      return this.entity.avatar ?? this.entity.attributes?.avatarUrl?.default ?? null;
    },
    computedStyle() {
      return {
        backgroundColor: this.computedBackgroundColor,
        borderColor: this.computedBackgroundColor,
        color: this.computedTextColor,
        height: this.computedSize,
        width: this.computedSize,
        fontSize: `calc(${this.computedSize} * 0.4)`,
      };
    },
    computedInitials() {
      return (
        this.entity.displayName
        || this.entity.label
        || ''
      )
        .replace(
          // remove emojis from string
          /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
          '',
        )
        .split(/\s+/g)
        .map((n) => n[0])
        .slice(0, 2)
        .join('');
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
  position: relative;
  overflow: hidden;

  img{
    object-fit: cover;
    z-index: 1;
    @apply bg-white;
    width: 100%;
    height: 100%;
  }

  &:after{
    content: attr(aria-label);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    @apply uppercase font-semibold whitespace-nowrap;
  }

}
</style>
