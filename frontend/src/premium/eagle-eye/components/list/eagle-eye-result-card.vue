<template>
  <div
    class="bg-white shadow-sm px-5 pt-5 pb-4 rounded-lg h-fit"
    :class="{
      'hover:shadow-md hover:cursor-pointer': result.url
    }"
    @click="onCardClick"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between pb-4 border-b border-gray-100"
    >
      <img
        :src="platformOptions[result.platform].img"
        class="w-6 h-6"
      />
      <span
        v-if="result.postedAt"
        class="text-gray-400 text-2xs"
        >{{ formatDateToTimeAgo(result.postedAt) }}</span
      >
    </div>

    <!-- Image -->
    <div
      v-if="result.post.thumbnail"
      class="rounded max-h-30 w-full overflow-hidden flex mt-4"
    >
      <app-image
        :src="result.post.thumbnail"
        :alt="result.post.title"
      />
    </div>

    <!-- Title & description -->
    <div class="mt-4 pb-9 border-b border-gray-100">
      <h6 v-if="result.post.title" class="black mb-3">
        {{ result.post.title }}
      </h6>
      <div
        class="eagle-eye-result-content text-gray-600 text-xs line-clamp-4"
      >
        {{ result.post.description }}
      </div>
    </div>

    <!-- Actions footer -->
    <span class="text-gray-400 text-3xs mt-2 mb-1"
      >Rate this content</span
    >
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-1">
        <el-tooltip placement="top" content="Relevant">
          <span
            :class="{
              '!cursor-auto': isLoading
            }"
            @click.stop
          >
            <div
              class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 group"
              :class="{
                'bg-green-100 hover:bg-green-100':
                  isRelevant,
                'pointer-events-none opacity-50': isLoading
              }"
              @click.stop="
                onThumbsClick({
                  actionType: 'thumbs-up',
                  shouldAdd: !isRelevant
                })
              "
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
          </span>
        </el-tooltip>

        <el-tooltip placement="top" content="Not relevant">
          <span
            :class="{
              '!cursor-auto': isLoading
            }"
            @click.stop
          >
            <div
              class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 group"
              :class="{
                'bg-red-100 hover:bg-red-100':
                  isNotRelevant,
                'pointer-events-none opacity-50': isLoading
              }"
              @click.stop="
                onThumbsClick({
                  actionType: 'thumbs-down',
                  shouldAdd: !isNotRelevant
                })
              "
            >
              <i
                class="text-lg group-hover:text-gray-900"
                :class="{
                  'ri-thumb-down-line text-gray-400':
                    !isNotRelevant,
                  'ri-thumb-down-fill text-red-600 group-hover:text-red-600':
                    isNotRelevant
                }"
              />
            </div>
          </span>
        </el-tooltip>
      </div>
      <el-tooltip
        placement="top"
        :content="bookmarkTooltip"
      >
        <span
          :class="{
            '!cursor-auto': isBookmarkDisabled
          }"
          @click.stop
        >
          <div
            class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 group"
            :class="{
              'bg-blue-100 hover:bg-blue-100': isBookmarked,
              'pointer-events-none bg-transparent':
                isBookmarkDisabled
            }"
            @click.stop="
              onActionClick({
                actionType: 'bookmark',
                shouldAdd: !isBookmarked
              })
            "
          >
            <i
              class="text-lg text-gray-400 group-hover:text-gray-900"
              :class="{
                'ri-bookmark-line text-gray-400':
                  !isBookmarked && !isBookmarkDisabled,
                'ri-bookmark-fill text-blue-600 group-hover:text-blue-600':
                  isBookmarked && !isBookmarkDisabled,
                'ri-bookmark-fill text-blue-300':
                  isBookmarkDisabled
              }"
            />
          </div>
        </span>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { formatDateToTimeAgo } from '@/utils/date'
import { computed, defineProps } from 'vue'
import { platformOptions } from '@/premium/eagle-eye/eagle-eye-constants'
import { withHttp } from '@/utils/string'
import {
  mapActions,
  mapGetters
} from '@/shared/vuex/vuex.helpers'

const props = defineProps({
  result: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
})

const { currentUser } = mapGetters('auth')
const { doAddAction, doRemoveAction } =
  mapActions('eagleEye')

const isLoading = computed(() => props.result.loading)
const isBookmarked = computed(() =>
  props.result.actions.some((a) => a.type === 'bookmark')
)
const isRelevant = computed(() =>
  props.result.actions.some((a) => a.type === 'thumbs-up')
)
const isNotRelevant = computed(() =>
  props.result.actions.some((a) => a.type === 'thumbs-down')
)
const isBookmarkedByUser = computed(
  () =>
    props.result.actions.find((a) => a.type === 'bookmark')
      ?.actionById === currentUser.value.id
)

const isBookmarkDisabled = computed(() => {
  return (
    isLoading.value ||
    (isBookmarked.value && !isBookmarkedByUser.value)
  )
})

const bookmarkTooltip = computed(() => {
  if (isBookmarked.value && !isBookmarkedByUser.value) {
    return 'Bookmarked by team member'
  }

  return isBookmarked.value ? 'Unbookmark' : 'Bookmark'
})

// Open post in origin url
const onCardClick = (e) => {
  if (!props.result.url || e.target.localName === 'a') {
    return
  }

  window.open(withHttp(props.result.url), '_blank')
}

// If opposite thumbs up is set, remove before creating the new action
const onThumbsClick = async ({ actionType, shouldAdd }) => {
  if (isLoading.value) {
    return
  }

  if (actionType === 'thumbs-up' && isNotRelevant.value) {
    await onActionClick({
      actionType: 'thumbs-down',
      shouldAdd: false
    })
  }

  if (actionType === 'thumbs-down' && isRelevant.value) {
    await onActionClick({
      actionType: 'thumbs-up',
      shouldAdd: false
    })
  }

  await onActionClick({ actionType, shouldAdd })
}

const onActionClick = async ({ actionType, shouldAdd }) => {
  if (isLoading.value) {
    return
  }

  if (shouldAdd) {
    await doAddAction({
      post: props.result,
      action: actionType,
      index: props.index
    })
  } else {
    const actionId = props.result.actions.find(
      (a) => a.type === actionType
    ).id
    await doRemoveAction({
      postId: props.result.id,
      actionId,
      actionType,
      index: props.index
    })
  }
}
</script>

<style lang="scss" scope>
.eagle-eye-result-content a {
  @apply text-gray-500 underline;
}
</style>
