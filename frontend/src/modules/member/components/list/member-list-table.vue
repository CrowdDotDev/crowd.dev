<template>
  <div v-if="!!count" class="mb-2">
    <app-pagination-sorter
      :page-size="Number(pagination.pageSize)"
      :total="count"
      :current-page="pagination.currentPage"
      :has-page-counter="false"
      module="member"
      position="top"
      @change-sorter="doChangePaginationPageSize"
    />
  </div>
  <div class="app-list-table panel">
    <app-member-list-toolbar></app-member-list-toolbar>
    <div class="-mx-6 -mt-6">
      <el-table
        ref="table"
        v-loading="loading"
        :data="rows"
        :default-sort="defaultSort"
        row-key="id"
        border
        :row-class-name="rowClass"
        @sort-change="doChangeSort"
        @row-click="handleRowClick"
      >
        <el-table-column
          type="selection"
          width="75"
          fixed
        ></el-table-column>

        <el-table-column
          label="Member"
          prop="displayName"
          width="220"
          sortable="custom"
          fixed
        >
          <template #default="scope">
            <div class="flex items-center text-black">
              <app-avatar
                :entity="scope.row"
                size="sm"
                class="mr-2"
              />
              <span class="font-semibold">{{
                scope.row.displayName
              }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          label="Organization & Title"
          width="220"
        >
          <template #default="scope">
            <app-member-organizations
              :member="scope.row"
              :show-title="false"
            />
          </template>
        </el-table-column>
        <el-table-column
          v-for="column of extraColumns"
          :key="column.name"
          :prop="column.name"
          :label="column.label"
          :width="column.width || 200"
          :sortable="column.sortable ? 'custom' : ''"
        >
          <template #default="scope">
            {{
              column.formatter
                ? column.formatter(scope.row[column.name])
                : scope.row[column.name]
            }}
          </template>
        </el-table-column>
        <el-table-column
          label="Engagement Level"
          prop="score"
          width="200"
          sortable="custom"
        >
          <template #default="scope">
            <app-member-engagement-level
              :member="scope.row"
            />
          </template>
        </el-table-column>
        <el-table-column
          label="Last activity"
          prop="lastActive"
          width="250"
          sortable="custom"
        >
          <template #default="scope">
            <app-member-last-activity :member="scope.row" />
          </template>
        </el-table-column>
        <el-table-column
          v-if="showReach"
          label="Reach"
          prop="reach"
          width="150"
          sortable="custom"
        >
          <template #default="scope">
            <app-member-reach :member="scope.row" />
          </template>
        </el-table-column>

        <el-table-column label="Identities" width="220">
          <template #default="scope">
            <app-member-channels
              :member="scope.row"
            ></app-member-channels>
          </template>
        </el-table-column>

        <el-table-column
          :width="maxTabWidth"
          :label="translate('entities.member.fields.tag')"
        >
          <template #default="scope">
            <app-tag-list :member="scope.row" />
          </template>
        </el-table-column>

        <el-table-column width="80" fixed="right">
          <template #default="scope">
            <div class="table-actions">
              <app-member-dropdown
                :member="scope.row"
              ></app-member-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!!count" class="mt-8 px-6">
        <app-pagination
          :total="count"
          :page-size="Number(pagination.pageSize)"
          :current-page="pagination.currentPage || 1"
          module="member"
          @change-current-page="
            doChangePaginationCurrentPage
          "
          @change-page-size="doChangePaginationPageSize"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppMemberListTable'
}
</script>

<script setup>
import { i18n } from '@/i18n'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import AppMemberListToolbar from '@/modules/member/components/list/member-list-toolbar.vue'
import AppMemberOrganizations from '@/modules/member/components/member-organizations.vue'
import AppMemberDropdown from '../member-dropdown'
import AppMemberChannels from '../member-channels'
import AppMemberReach from '../member-reach.vue'
import AppTagList from '@/modules/tag/components/tag-list'
import AppMemberEngagementLevel from '../member-engagement-level'
import AppMemberLastActivity from '../member-last-activity'

const store = useStore()
const router = useRouter()
const table = ref(null)

const extraColumns = computed(
  () => store.getters['member/activeView']?.columns || []
)

const activeView = computed(
  () => store.getters['member/activeView']
)

const defaultSort = computed(() => {
  if (activeView.value?.sorter) {
    return activeView.value.sorter
  }

  return {
    field: 'lastActive',
    order: 'descending'
  }
})

const integrations = computed(
  () => store.getters['integration/activeList'] || {}
)

const showReach = computed(() => {
  return integrations.value.twitter?.status === 'done'
})

const rows = computed(() => store.getters['member/rows'])
const count = computed(() => store.state.member.count)
const loading = computed(
  () => store.state.member.list.loading
)

const maxTabWidth = computed(() => {
  let maxTabWidth = 0
  for (const row of rows.value) {
    if (row.tags) {
      const t = row.tags.map((tag) => tag.name.length * 14)
      console.log(t)
      const tabWidth = row.tags
        .map((tag) => tag.name.length * 14)
        .reduce((a, b) => a + b, 0)

      if (tabWidth > maxTabWidth) {
        maxTabWidth = tabWidth
      }
    }
  }
  console.log('maxTabWidth', maxTabWidth)
  return Math.min(maxTabWidth + 100, 500)
})

const selectedRows = computed(
  () => store.getters['member/selectedRows']
)
const pagination = computed(
  () => store.getters['member/pagination']
)

onMounted(async () => {
  if (store.state.integration.count === 0) {
    await store.dispatch('integration/doFetch')
  }
  doMountTable(table.value)
})

function doChangeSort(sorter) {
  store.dispatch('member/doChangeSort', sorter)
}

function doChangePaginationCurrentPage(currentPage) {
  store.dispatch(
    'member/doChangePaginationCurrentPage',
    currentPage
  )
}

function doChangePaginationPageSize(pageSize) {
  store.dispatch(
    'member/doChangePaginationPageSize',
    pageSize
  )
}

function doMountTable(tableRef) {
  store.dispatch('member/doMountTable', tableRef)
}

function translate(key) {
  return i18n(key)
}

function rowClass({ row }) {
  const isSelected =
    selectedRows.value.find((r) => r.id === row.id) !==
    undefined

  return isSelected ? 'is-selected' : ''
}

function handleRowClick(row) {
  router.push({
    name: 'memberView',
    params: { id: row.id }
  })
}
</script>
