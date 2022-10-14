<template>
  <app-filter-dropdown
    module="member"
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

onMounted(async () => {
  await store.dispatch('member/doFetchCustomAttributes')
})
</script>
