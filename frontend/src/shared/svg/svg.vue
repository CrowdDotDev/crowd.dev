<template>
  <div class="flex">
    <svg v-bind="$attrs">
      <use
        :href="`/icons/crowd-icons.svg?#${name}`"
        fill="#9CA3AF"
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
    }
  }
}
</script>
