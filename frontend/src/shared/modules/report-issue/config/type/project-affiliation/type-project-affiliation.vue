<template>
  <p class="text-medium">
    {{ props.attribute.name }}
  </p>
</template>

<script setup lang="ts">
const props = defineProps<{
  attribute: any
}>();
</script>
