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
        v-for="(conversation, ci) of conversations"
        :key="conversation.id"
        :class="{
          'border-b': ci < conversations.length - 1
        }"
        :conversation="conversation"
        :is-card="itemsAsCards"
      />
      <div v-if="conversations.length === 0">
        <p class="text-xs leading-5 text-center pt-4">
          No trending conversations during this period
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
