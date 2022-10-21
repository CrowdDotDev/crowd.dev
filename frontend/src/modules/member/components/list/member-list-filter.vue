<template>
  <div class="member-filter">
    <app-filter-list
      module="member"
      placeholder="Search members..."
      :search-filter="memberSearch"
    >
      <template #dropdown>
        <app-filter-dropdown
          module="member"
          :attributes="memberAttributes"
          :custom-attributes="customAttributes"
        />
      </template>
    </app-filter-list>
  </div>
</template>

<script>
export default {
  name: 'AppMemberListFilter'
}
</script>

<script setup>
import { MemberModel } from '@/modules/member/member-model'
import { useStore } from 'vuex'
import { onMounted, computed } from 'vue'
import getCustomAttributes from '@/shared/fields/get-custom-attributes.js'

const store = useStore()

const memberAttributes = Object.values(
  MemberModel.fields
).filter((f) => f.filterable)
const customAttributes = computed(() => {
  return getCustomAttributes(
    store.state.member.customAttributes
  )
})

const memberSearch = computed(() => {
  return MemberModel.fields.search.forFilter()
})

async function doFetch() {
  const { filter } = store.state.member

  await store.dispatch('member/doFetch', {
    filter,
    keepPagination: true
  })
}

onMounted(async () => {
  await store.dispatch('member/doFetchCustomAttributes')
  await doFetch()
})
</script>

<style></style>
