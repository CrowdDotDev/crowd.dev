<template>
  <div class="member-filter">
    <app-filter-list
      module="communityHelpCenter"
      placeholder="Search conversations..."
      :search-filter="conversationSearch"
    >
      <template #dropdown>
        <app-filter-dropdown
          module="communityHelpCenter"
          :attributes="conversationAttributes"
        />
      </template>
    </app-filter-list>
  </div>
</template>

<script>
export default {
  name: 'AppCommunityHelpCenterFilter'
}
</script>

<script setup>
import { ConversationModel } from '@/modules/conversation/conversation-model'
import { useStore } from 'vuex'
import { onMounted, computed } from 'vue'

const store = useStore()

const conversationAttributes = Object.values(
  ConversationModel.fields
).filter((f) => f.filterable)

const conversationSearch = computed(() => {
  return ConversationModel.fields.search.forFilter()
})

async function doFetch() {
  const { filter } = store.state.communityHelpCenter

  await store.dispatch('communityHelpCenter/doFetch', {
    filter,
    keepPagination: true
  })
}

onMounted(async () => {
  await doFetch()
})
</script>

<style></style>
