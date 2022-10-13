<template>
  <div
    class="avatar"
    :class="computedClass"
    :style="computedStyle"
  >
    <span
      v-if="!entity.avatar"
      class="font-semibold text-lg uppercase"
      >{{ entity.displayName[0] }}</span
    >
  </div>
</template>

<script>
export default {
  name: 'AppAvatar',
  props: {
    entity: {
      type: Object,
      default: () => {}
    },
    size: {
      type: String,
      default: 'md'
    }
  },
  data() {
    return {
      backgroundColors: [
        '#EBECED',
        '#E9E5E3',
        '#FAEBDD',
        '#FBF3DB',
        '#DDEDEA',
        '#DDEBF1',
        '#EAE4F2',
        '#F4DFEB',
        '#FBE4E4'
      ],
      textColors: [
        '#9B9A97',
        '#64473A',
        '#D9730D',
        '#DFAB01',
        '#0F7B6C',
        '#0B6E99',
        '#6940A5',
        '#AD1A72',
        '#E03E3E'
      ]
    }
  },
  computed: {
    computedBackgroundColor() {
      return this.backgroundColors[
        this.entity.displayName.length %
          this.backgroundColors.length
      ]
    },
    computedTextColor() {
      return this.textColors[
        this.entity.displayName.length %
          this.textColors.length
      ]
    },
    computedStyle() {
      return this.entity.avatar
        ? `background-image: url(${this.entity.avatar}`
        : {
            backgroundColor: this.computedBackgroundColor,
            borderColor: this.computedBackgroundColor,
            color: this.computedTextColor
          }
    },
    computedClass() {
      return `avatar--${this.size}`
    }
  }
}
</script>

<style lang="scss">
.avatar {
  @apply rounded-full h-12 w-12 shrink-0 flex justify-center items-center;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  border: 1px solid #dedede;

  &--xl {
    @apply h-18 w-18;
  }

  &--lg {
    @apply h-16 w-16;
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
}
</style>
