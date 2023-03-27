<template>
  <div v-if="isVisible" class="popover-wrapper">
    <el-popover
      :visible="isVisible"
      :trigger="trigger"
      :title="title"
      :placement="placement"
      :show-arrow="showArrow"
      popper-class="app-popover"
      width="352px"
      :persistent="false"
      @show="isVisible = true"
      @hide="isVisible = false"
    >
      <div>
        <slot />
      </div>
    </el-popover>
    <app-teleport v-if="isVisible" to="#teleport-modal">
      <transition name="fade">
        <div
          class="fixed inset-0 bg-black opacity-20 cursor-pointer z-10"
          @click="
            trigger === 'manual'
              ? $emit('hide')
              : (isVisible = false)
          "
        />
      </transition>
    </app-teleport>
  </div>
</template>

<script>
export default {
  name: 'AppPopover',
  props: {
    trigger: {
      type: String,
      default: 'manual',
    },
    title: {
      type: String,
      default: null,
    },
    placement: {
      type: String,
      default: null,
    },
    visible: {
      type: Boolean,
      default: false,
    },
    showArrow: {
      type: Boolean,
      default: false,
    },
    customClass: {
      type: String,
      default: null,
    },
  },
  emits: ['hide'],
  data() {
    return {
      isVisible: this.visible,
    };
  },
  watch: {
    visible: {
      handler(newValue) {
        this.isVisible = newValue;
      },
    },
    isVisible: {
      handler(newValue) {
        if (newValue) {
          setTimeout(() => {
            const el = document.querySelector('.app-popover');

            const offsetTop = this.$el.getBoundingClientRect().top
              + window.pageYOffset;
            const offsetLeft = this.$el.getBoundingClientRect().left
              + window.pageXOffset;

            el.style.top = `${offsetTop - 100}px`;
            el.style.left = `${offsetLeft
              - (offsetLeft < 242 ? 0 : 242)
            }px`;
          }, 100);
        }
      },
    },
  },
};
</script>

<style lang="scss">
.app-popover {
  @apply z-20 border border-gray-300 rounded-lg shadow-none p-3 fixed;
}
</style>
