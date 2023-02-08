<template>
  <div
    class="grid grid-cols-3 sm:grid-cols-2 gap-5 pr-8 pb-10"
  >
    <div class="col-span-1 flex flex-col gap-5">
      <div
        v-for="item in getItemsInColumn(0)"
        :key="item.title"
      >
        <app-eagle-eye-result-card
          :title="item.title"
          :body="item.body"
          :platform="item.platform"
          :url="item.url"
          :img="item.img"
          :video="item.video"
          :subreddit="item.subreddit"
        />
      </div>
    </div>

    <div class="col-span-1 flex flex-col gap-5">
      <div
        v-for="item in getItemsInColumn(1)"
        :key="item.title"
      >
        <app-eagle-eye-result-card
          :title="item.title"
          :body="item.body"
          :platform="item.platform"
          :url="item.url"
          :img="item.img"
          :video="item.video"
          :subreddit="item.subreddit"
        />
      </div>
    </div>

    <div class="col-span-1 flex flex-col gap-5">
      <div
        v-for="item in getItemsInColumn(2)"
        :key="item.title"
      >
        <app-eagle-eye-result-card
          :title="item.title"
          :body="item.body"
          :platform="item.platform"
          :url="item.url"
          :img="item.img"
          :video="item.video"
          :subreddit="item.subreddit"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import AppEagleEyeResultCard from '@/premium/eagle-eye/components/list/eagle-eye-result-card.vue'
import { defineProps } from 'vue'

// TODO: Delete this
const props = defineProps({
  list: {
    type: Array,
    default: () => [
      {
        title:
          'Beginners Learning Path for Machine Learning',
        body: '(0) Made your mind towards machine learning but are confused so much that where to get started. I faced the same confusion...',
        platform: 'devto',
        url: 'www.google.com'
      },
      {
        title:
          'Beginners Learning Path for Machine Learning',
        body: '(1) <a href="www.twitter.com">www.twitter.com</a> Made your mind towards machine learning but are confused so much that where to get started. I faced the same confusion... but are confused so much that where to get started. I faced the same confusion Made your mind towards machine learning but are confused so much that where to get started. I faced the same confusion... but are confused so much that where to get started. I faced the same confusion...',
        platform: 'devto',
        url: 'www.google.com'
      },
      {
        title:
          'Beginners Learning Path for Machine Learning',
        body: '(2) Made your mind towards',
        platform: 'reddit',
        subreddit: 'r/datascience',
        url: 'www.google.com'
      },
      {
        title:
          'Beginners Learning Path for Machine Learning',
        body: '(3) Made your mind towards machine learning but are confused so much that where to get started. I faced the same confusion...',
        platform: 'devto',
        url: 'www.google.com'
      },
      {
        title:
          'Beginners Learning Path for Machine Learning',
        body: '(4) Made your mind towards machine learning but are confused so much that where to get started. I faced the same confusion...',
        platform: 'devto',
        url: 'www.google.com',
        img: 'https://images.pexels.com/photos/2775196/pexels-photo-2775196.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500'
      },
      {
        title:
          'Beginners Learning Path for Machine Learning',
        body: '(5) Made your mind towards machine learning but are confused so much that where to get started. I faced the same confusion...',
        platform: 'devto',
        url: 'www.google.com',
        video:
          'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
      }
    ]
  }
})

const getItemsInColumn = (column) => {
  return props.list.filter(
    (_v, i) => (i - column) % 3 === 0
  )
}
</script>
