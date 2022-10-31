<template>
  <div class="pt-3">
    <div
      v-if="loading && !conversations.length"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5"
    ></div>
    <div v-else>
      <!-- Empty state -->
      <app-empty-state-cta
        v-if="conversations.length === 0"
        icon="ri-question-answer-line"
        title="No conversations found"
        :description="
          hasFilter
            ? 'We couldn\'t find any results that match your search criteria, please try a different query'
            : 'Your community has no conversations yet'
        "
      ></app-empty-state-cta>

      <div v-else>
        <div class="mb-4">
          <app-pagination-sorter
            v-model="sorterFilter"
            :page-size="Number(pagination.pageSize)"
            :total="count"
            :current-page="pagination.currentPage"
            :has-page-counter="false"
            module="conversation"
            position="top"
            @change-sorter="doChangeFilter"
          />
        </div>

        <!-- Conversation item list -->
        <app-conversation-item
          v-for="conversation of conversations"
          :key="conversation.id"
          :conversation="conversation"
          @details="conversationId = conversation.id"
        />

        <!-- Load more button -->
        <div
          v-if="isLoadMoreVisible"
          class="flex grow justify-center pt-4"
        >
          <div
            v-if="loading"
            v-loading="loading"
            class="app-page-spinner h-16 !relative !min-h-5"
          ></div>
          <el-button
            v-else
            class="btn btn-link btn-link--primary"
            @click="onLoadMore"
            ><i class="ri-arrow-down-line"></i
            ><span class="text-xs"
              >Load more</span
            ></el-button
          >
        </div>
      </div>
    </div>
  </div>
  <app-conversation-drawer
    :expand="conversationId != null"
    :conversation-id="conversationId"
    @close="conversationId = null"
  ></app-conversation-drawer>
</template>

<script>
export default {
  name: 'AppConversationsList'
}
</script>

<script setup>
import AppConversationItem from '@/modules/conversation/components/conversation-item'
import AppConversationDrawer from '@/modules/conversation/components/conversation-drawer'
import AppPaginationSorter from '@/shared/pagination/pagination-sorter'
import { defineProps, computed, ref } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const sorterFilter = ref('trending')
const conversationId = ref(null)

defineProps({
  conversations: {
    type: Array,
    default: () => {}
  },
  loading: {
    type: Boolean,
    default: false
  },
  itemsAsCards: {
    type: Boolean,
    default: false
  }
})

const hasFilter = computed(
  () =>
    !!Object.keys(store.state.activity.filter.attributes)
      .length
)
const count = computed(() => store.state.activity.count)
const pagination = computed(
  () => store.getters['activity/pagination']
)
const isLoadMoreVisible = computed(() => {
  return (
    pagination.value.currentPage *
      pagination.value.pageSize <
    count.value
  )
})

function doChangeFilter(filter) {
  let sorter = 'lastActive'

  if (filter === 'trending') {
    sorter = 'activityCount'
  }

  store.dispatch('activity/doChangeSort', {
    prop: sorter,
    order: 'descending'
  })
}

const onLoadMore = () => {
  const newPageSize = pagination.value.pageSize + 10

  store.dispatch(
    'activity/doChangePaginationPageSize',
    newPageSize
  )
}
</script>
