<template>
  <div
    class="bg-white shadow-sm px-5 pt-5 pb-4 rounded-lg h-fit"
    :class="{
      'hover:shadow-md hover:cursor-pointer': url
    }"
    @click="onCardClick"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between pb-4 border-b border-gray-100"
    >
      <img
        :src="platformOptions[platform].img"
        class="w-6 h-6"
      />
      <span class="text-gray-400 text-2xs">{{
        formatDateToTimeAgo(publishedDate)
      }}</span>
    </div>

    <!-- Image -->
    <div
      v-if="img || video"
      class="rounded min-h-30 max-h-30 w-full overflow-hidden flex mt-4"
    >
      <img
        v-if="img"
        :src="img"
        class="object-cover object-center"
      />
      <video v-if="video" height="120" controls>
        <source
          :src="video"
          type="video/mp4"
          class="object-cover object-center"
        />
      </video>
    </div>

    <!-- Title & Body -->
    <div class="mt-4 pb-9 border-b border-gray-100">
      <a
        v-if="subreddit"
        :href="`https://www.reddit.com/${subreddit}`"
        target="_blank"
        class="text-xs mb-1 font-medium"
        >{{ subreddit }}</a
      >
      <h6 v-if="title" class="black mb-3">{{ title }}</h6>
      <app-parsed-html
        :body="body"
        class="eagle-eye-result-content text-gray-600 text-xs line-clamp-4"
      />
    </div>

    <!-- Actions footer -->
    <span class="text-gray-400 text-3xs mt-2 mb-1"
      >Rate this content</span
    >
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-1">
        <el-tooltip placement="top" content="Relevant">
          <div
            class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 group"
            :class="{
              'bg-green-100 hover:bg-green-100': isRelevant
            }"
            @click.stop
          >
            <i
              class="text-lg group-hover:text-gray-900"
              :class="{
                'ri-thumb-up-line text-gray-400':
                  !isRelevant,
                'ri-thumb-up-fill text-green-600 group-hover:text-green-600':
                  isRelevant
              }"
            />
          </div>
        </el-tooltip>

        <el-tooltip placement="top" content="Not relevant">
          <div
            class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 group"
            :class="{
              'bg-red-100 hover:bg-red-100':
                isRelevant === false
            }"
            @click.stop
          >
            <i
              class="text-lg group-hover:text-gray-900"
              :class="{
                'ri-thumb-down-line text-gray-400':
                  isRelevant !== false,
                'ri-thumb-down-fill text-red-600 group-hover:text-red-600':
                  isRelevant === false
              }"
            />
          </div>
        </el-tooltip>
      </div>

      <el-tooltip
        placement="top"
        :content="isBookmarked ? 'Unbookmark' : 'Bookmark'"
      >
        <div
          class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 group"
          :class="{
            'bg-blue-100 hover:bg-blue-100': isBookmarked
          }"
          @click.stop
        >
          <i
            class="text-lg text-gray-400 group-hover:text-gray-900"
            :class="{
              'ri-bookmark-line text-gray-400':
                !isBookmarked,
              'ri-bookmark-fill text-blue-600 group-hover:text-blue-600':
                isBookmarked
            }"
          />
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { formatDateToTimeAgo } from '@/utils/date'
import { defineProps } from 'vue'
import { platformOptions } from '@/premium/eagle-eye/eagle-eye-constants'
import { withHttp } from '@/utils/string'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true
  },
  publishedDate: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: null
  },
  url: {
    type: String,
    default: null
  },
  isRelevant: {
    type: Boolean,
    default: null
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  subreddit: {
    type: String,
    default: null
  },
  img: {
    type: String,
    default: null
  },
  video: {
    type: String,
    default: null
  }
})

const onCardClick = (e) => {
  if (!props.url || e.target.localName === 'a') {
    return
  }

  window.open(withHttp(props.url), '_blank')
}
</script>

<style lang="scss" scope>
.eagle-eye-result-content a {
  @apply text-gray-500 underline;
}
</style>
