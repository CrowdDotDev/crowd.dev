<template>
  <div class="flex">
    <svg v-bind="$attrs">
      <use
        :href="`/icons/crowd-icons.svg?#${name}`"
        :fill="color"
      />
    </svg>
  </div>
</template>

<script>
export default {
  name: 'AppSvg',
  props: {
    name: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: '#9CA3AF'
    }
  }
}
</script>
