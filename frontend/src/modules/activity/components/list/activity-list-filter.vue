<template>
  <div :class="`${computedModule}-filter`">
    <app-filter-list
      module="activity"
      :placeholder="computedPlaceholder"
      :search-filter="search"
    >
      <template #dropdown>
        <app-filter-dropdown
          module="activity"
          :attributes="attributes"
        />
      </template>
    </app-filter-list>
  </div>
</template>

<script>
export default {
  name: 'AppActivityListFilter'
}
</script>

<script setup>
import { ActivityModel } from '@/modules/activity/activity-model'
import { ConversationModel } from '@/modules/conversation/conversation-model'
import { useStore } from 'vuex'
import { onMounted, defineProps, computed } from 'vue'

const store = useStore()
const props = defineProps({
  module: {
    type: String,
    required: true
  }
})
const activeView = computed(
  () => store.getters['activity/activeView']
)
const computedModule = computed(() => {
  if (props.module === 'activities') {
    return 'activity'
  }

  return 'conversation'
})

const computedPlaceholder = computed(() => {
  if (props.module === 'activities') {
    return 'Search activities...'
  }

  return 'Search conversations...'
})

const search = computed(() => {
  const fields =
    props.module === 'activities'
      ? ActivityModel.fields
      : ConversationModel.fields

  return fields.search.forFilter()
})

const attributes = computed(() => {
  const fields =
    props.module === 'activities'
      ? ActivityModel.fields
      : ConversationModel.fields

  return Object.values(fields).filter((f) => f.filterable)
})

onMounted(async () => {
  // Ob Conversations tab, the fetch is already done on the changeActiveView action
  if (activeView.value.type !== 'conversations') {
    await doFetch()
  }
})

async function doFetch() {
  const { filter } = store.state.activity

  await store.dispatch('activity/doFetch', {
    filter,
    keepPagination: true
  })
}
</script>

<style></style>
