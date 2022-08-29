<template>
  <div class="popover-wrapper">
    <el-popover
      v-model="isVisible"
      :trigger="trigger"
      :title="title"
      :placement="placement"
      :visible-arrow="visibleArrow"
      popper-class="app-popover"
      @show="isVisible = true"
      @hide="isVisible = false"
    >
      <slot v-if="isVisible"></slot>
    </el-popover>
    <transition name="fade">
      <div
        v-if="isVisible"
        class="fixed inset-0 bg-black opacity-20 cursor-pointer z-10"
        @click="
          trigger === 'manual'
            ? $emit('hide')
            : (isVisible = false)
        "
      ></div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'AppPopover',
  props: {
    trigger: {
      type: String,
      default: 'manual'
    },
    title: {
      type: String,
      default: null
    },
    placement: {
      type: String,
      default: null
    },
    visible: {
      type: Boolean,
      default: false
    },
    visibleArrow: {
      type: Boolean,
      default: true
    },
    customClass: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      isVisible: this.visible
    }
  },
  watch: {
    visible: {
      handler(newValue) {
        this.isVisible = newValue
      }
    },
    isVisible: {
      handler(newValue) {
        if (newValue) {
          const el = this.$el.querySelector('.app-popover')

          const offsetTop =
            this.$el.getBoundingClientRect().top +
            window.pageYOffset
          const offsetLeft =
            this.$el.getBoundingClientRect().left +
            window.pageXOffset

          el.style.top = offsetTop - 100 + 'px'
          el.style.left =
            offsetLeft - (offsetLeft < 242 ? 0 : 242) + 'px'
        }
      }
    }
  }
}
</script>

<style lang="scss">
.app-popover {
  @apply z-20 border border-gray-300 rounded-lg shadow-none p-3 fixed w-88;
}
</style>
