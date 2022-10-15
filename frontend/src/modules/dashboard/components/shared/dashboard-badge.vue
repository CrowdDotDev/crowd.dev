<template>
  <div
    class="py-0.5 px-1 rounded text-2xs leading-3"
    :class="[typeClass]"
  >
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'AppDashboardBadge',
  props: {
    type: {
      required: false,
      type: String,
      default: 'success'
    }
  },
  computed: {
    typeClass() {
      if (this.type === 'success') {
        return 'bg-green-100 text-green-700'
      } else if (this.type === 'danger') {
        return 'bg-red-50 text-red-600'
      } else {
        return 'bg-blue-100 text-blue-700'
      }
    }
  }
}
</script>
