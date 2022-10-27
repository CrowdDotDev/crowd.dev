<template>
  <div
    class="rounded-lg mt-4 p-4 border"
    :class="alertClass"
  >
    <div class="flex items-start">
      <i
        class="mr-4 ri-xl flex items-center pt-1"
        :class="iconClass"
      ></i>
      <div class="text-sm">
        <div class="font-semibold mb-1">
          <slot name="title"> Action Required </slot>
        </div>
        <slot name="body"> This is the body </slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppAlert',
  props: {
    title: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'warning'
    }
  },
  computed: {
    alertClass() {
      switch (this.type) {
        case 'warning':
          return 'bg-yellow-50 border-yellow-500'
        default:
          return 'border-blue-500 bg-blue-50'
      }
    },
    iconClass() {
      switch (this.type) {
        case 'warning':
          return 'text-yellow-500 ri-error-warning-fill'
        default:
          return 'text-blue-500 ri-information-fill'
      }
    }
  }
}
</script>
