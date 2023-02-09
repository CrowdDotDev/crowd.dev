<template>
  <div
    class="grid grid-cols-3 sm:grid-cols-2 gap-5 pr-8 pb-10 pl-3"
  >
    <div
      v-for="(_, i) in Array(3)"
      :key="i"
      class="col-span-1 flex flex-col gap-5"
    >
      <div
        v-for="(item, index) in getItemsInColumn(i)"
        :key="item.post.title"
      >
        <app-eagle-eye-result-card
          :result="item"
          :index="index * 3 + i"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import AppEagleEyeResultCard from '@/premium/eagle-eye/components/list/eagle-eye-result-card.vue'
import { defineProps } from 'vue'

const props = defineProps({
  list: {
    type: Array,
    default: () => []
  }
})

const getItemsInColumn = (column) => {
  return props.list.filter(
    (_v, i) => (i - column) % 3 === 0
  )
}
</script>
