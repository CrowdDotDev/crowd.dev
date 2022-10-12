<template>
  <div class="member-filter">
    <app-filter-list module="member">
      <template #dropdown>
        <app-member-list-filter-dropdown />
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
import AppMemberListFilterDropdown from './member-list-filter-dropdown'
import { useStore } from 'vuex'
import { onMounted } from 'vue'

const store = useStore()

onMounted(async () => {
  await doFetch()
})

async function doFetch() {
  const filter = {
    ...store.state.member.filter
  }
  await store.dispatch('member/doFetch', {
    filter,
    keepPagination: true
  })
}
</script>

<style></style>
