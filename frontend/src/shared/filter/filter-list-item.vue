<template>
  <div>
    {{ filter }}
  </div>
</template>

<script>
export default {
  name: 'AppFilterListItem'
}
</script>

<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  filter: {
    type: Object,
    default: () => {}
  }
})

defineEmits(['filter-removed', 'filter-changed'])
</script>
