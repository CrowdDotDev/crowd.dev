<template>
  <div
    class="text-xs leading-5 border-b-2 transition p-2.5 text-center cursor-pointer"
    :class="[active ? 'font-medium border-brand-500' : '']"
  >
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'AppDashboardTab',
  props: {
    active: {
      required: false,
      type: Boolean,
      default: false
    }
  }
}
</script>
