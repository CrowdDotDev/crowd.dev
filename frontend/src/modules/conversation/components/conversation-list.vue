<template>
  <div v-if="!!count" class="mb-2">
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
  <div class="pt-3">
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5"
    ></div>
    <div v-else>
      <app-conversation-item
        v-for="conversation of conversations"
        :key="conversation.id"
        :conversation="conversation"
        :is-card="itemsAsCards"
      />
      <div v-if="conversations.length === 0">
        <div class="flex justify-center pt-16">
          <i
            class="ri-question-answer-line text-4xl h-12 text-gray-300"
          ></i>
        </div>
        <p
          class="text-xs leading-5 text-center italic text-gray-400 pt-4 pb-12"
        >
          There are no conversations
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppConversationsList'
}
</script>

<script setup>
import AppConversationItem from '@/modules/conversation/components/conversation-item'
import { defineProps, computed, ref } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const sorterFilter = ref('trending')

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

const count = computed(() => store.state.activity.count)
const pagination = computed(
  () => store.getters['activity/pagination']
)

function doChangeFilter(filter) {
  console.log(filter)
}
</script>
