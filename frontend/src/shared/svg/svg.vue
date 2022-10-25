<template>
  <div class="flex">
    <svg v-bind="$attrs">
      <use
        :xlink:href="`/icons/crowd-icons.svg?#${name}`"
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
