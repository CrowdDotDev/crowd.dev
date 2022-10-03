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
import memberAttributes from '@/jsons/member-attributes.json'
import { useStore } from 'vuex'
import { onMounted, computed } from 'vue'

const store = useStore()
const customAttributes = computed(() => {
  return (
    Object.values(store.state.member.customAttributes) || []
  )
})
onMounted(async () => {
  await store.dispatch('member/doFetchCustomAttributes')
})
</script>
