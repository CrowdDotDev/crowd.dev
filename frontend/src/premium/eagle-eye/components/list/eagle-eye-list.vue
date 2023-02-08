<template>
  <div
    class="grid grid-cols-3 sm:grid-cols-2 gap-5 pr-8 pb-10 pl-3"
  >
    <div
      v-for="(_, index) in Array(3)"
      :key="index"
      class="col-span-1 flex flex-col gap-5"
    >
      <div
        v-for="item in getItemsInColumn(index)"
        :key="item.post.title"
      >
        <app-eagle-eye-result-card
          :title="item.post.title"
          :body="item.post.description"
          :platform="item.platform"
          :url="item.url"
          :img="item.post.thumbnail"
          :video="item.video"
          :posted-at="item.postedAt"
          :subreddit="item.subreddit"
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
