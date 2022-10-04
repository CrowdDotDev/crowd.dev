<template>
  <div class="member-filter">
    <div class="mb-6">
      <el-input
        v-model="model.query"
        placeholder="Search members"
        :prefix-icon="SearchIcon"
        clearable
      >
        <template #append>
          <app-member-list-filter-dropdown />
        </template>
      </el-input>
    </div>
    <app-filter-list />
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
import { h, onMounted, reactive } from 'vue'

const store = useStore()
const model = reactive({
  query: null
})
const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  []
)

onMounted(async () => {
  await doFetch()
})

async function doFetch() {
  const filter = {}
  await store.dispatch('member/doFetch', {
    filter,
    keepPagination: true
  })
}
</script>

<style></style>
