<template>
  <app-filter-dropdown
    :attributes="memberAttributes"
    :custom-attributes="customAttributes"
  />
</template>

<script>
export default {
  name: 'AppMemberListFilterDropdown'
}
</script>

<script setup>
import { MemberModel } from '@/modules/member/member-model'
import { useStore } from 'vuex'
import { onMounted, computed } from 'vue'

const store = useStore()
const memberAttributes = Object.values(
  MemberModel.fields
).filter((f) => f.filterable)
const customAttributes = computed(() => {
  return (
    Object.values(store.state.member.customAttributes) || []
  )
})
onMounted(async () => {
  await store.dispatch('member/doFetchCustomAttributes')
})
</script>
