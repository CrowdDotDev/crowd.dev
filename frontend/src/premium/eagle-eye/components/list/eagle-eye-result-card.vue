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
      <div
        v-if="result.platform === 'twitter'"
        class="text-sm text-gray-900 break-words"
      >
        {{ result.post.description }}
      </div>
      <div v-else>
        <a
          v-if="subreddit"
          class="text-xs mb-1 font-medium leading-6"
          target="_blank"
          :href="`https://www.reddit.com/${subreddit}`"
        >
          {{ subreddit }}
        </a>
        <h6
          v-if="result.post.title"
          class="black mb-3 break-words"
        >
          {{ result.post.title }}
        </h6>
        <div
          class="eagle-eye-result-content text-gray-600 text-xs line-clamp-4 break-words"
        >
          {{ result.post.description }}
        </div>
      </div>
    </div>

    <!-- Actions footer -->
    <span class="text-gray-400 text-3xs mt-2 mb-1"
      >Rate this content</span
    >
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-1">
        <el-tooltip placement="top" content="Relevant">
          <span @click.stop>
            <div
              class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 group"
              :class="{
                'bg-green-100 hover:bg-green-100':
                  isRelevant
              }"
              @click.stop="
                onActionClick({
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
          <span @click.stop>
            <div
              class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 group"
              :class="{
                'bg-red-100 hover:bg-red-100': isNotRelevant
              }"
              @click.stop="
                onActionClick({
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
            '!cursor-auto': isBookmarkedByTeam
          }"
          @click.stop
        >
          <div
            class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 group"
            :class="{
              'bg-blue-100 hover:bg-blue-100': isBookmarked,
              'pointer-events-none': isBookmarkedByTeam
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
                  !isBookmarked && !isBookmarkedByTeam,
                'ri-bookmark-fill text-blue-600 group-hover:text-blue-600':
                  isBookmarked && !isBookmarkedByTeam,
                'ri-bookmark-fill text-blue-300':
                  isBookmarkedByTeam
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
import platformOptions from '@/premium/eagle-eye/constants/eagle-eye-platforms.json'
import { EagleEyeService } from '../../eagle-eye-service'
import { withHttp } from '@/utils/string'
import { mapGetters } from '@/shared/vuex/vuex.helpers'
import { useStore } from 'vuex'
import moment from 'moment'

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

const store = useStore()
const { currentUser } = mapGetters('auth')

const isBookmarked = computed(() =>
  props.result.actions.some(
    (a) => a.type === 'bookmark' && !a.toRemove
  )
)
const isRelevant = computed(() =>
  props.result.actions.some(
    (a) => a.type === 'thumbs-up' && !a.toRemove
  )
)
const isNotRelevant = computed(() =>
  props.result.actions.some(
    (a) => a.type === 'thumbs-down' && !a.toRemove
  )
)
const isBookmarkedByUser = computed(() => {
  const bookmarkAction = props.result.actions.find(
    (a) => a.type === 'bookmark'
  )
  return (
    !bookmarkAction?.actionById ||
    bookmarkAction?.actionById === currentUser.value.id
  )
})

const isBookmarkedByTeam = computed(() => {
  return isBookmarked.value && !isBookmarkedByUser.value
})

const bookmarkTooltip = computed(() => {
  if (isBookmarked.value && !isBookmarkedByUser.value) {
    return 'Bookmarked by team member'
  }

  return isBookmarked.value ? 'Unbookmark' : 'Bookmark'
})

const subreddit = computed(() => {
  if (props.result.platform !== 'reddit') {
    return null
  }

  const pattern =
    /.*reddit\.com(?<subreddit>\/r\/.[^\\/]*).*/gm
  const matches = pattern.exec(props.result.url)

  if (!matches.groups.subreddit) {
    return null
  }

  return matches.groups.subreddit.slice(1)
})

// Open post in origin url
const onCardClick = async (e) => {
  if (!props.result.url || e.target.localName === 'a') {
    return
  }

  window.open(withHttp(props.result.url), '_blank')

  await EagleEyeService.trackClick({
    url: props.result.url,
    platform: props.result.platform
  })
}

const onActionClick = async ({ actionType, shouldAdd }) => {
  const storeActionType = shouldAdd ? 'add' : 'delete'
  const action = shouldAdd
    ? {
        type: actionType,
        timestamp: moment()
      }
    : props.result.actions.find(
        (a) => a.type === actionType
      )

  store.dispatch('eagleEye/doAddTemporaryPostAction', {
    index: props.index,
    storeActionType,
    action
  })

  store.dispatch('eagleEye/doAddActionQueue', {
    index: props.index,
    id: props.result.id,
    post: props.result,
    handler: async () =>
      await store.dispatch('eagleEye/doUpdatePostAction', {
        post: props.result,
        index: props.index,
        storeActionType,
        actionType
      })
  })
}
</script>

<style lang="scss" scope>
.eagle-eye-result-content a {
  @apply text-gray-500 underline;
}
</style>
