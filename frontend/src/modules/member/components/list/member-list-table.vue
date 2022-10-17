<template>
  <div v-if="!!count" class="mb-2">
    <app-pagination-sorter
      :page-size="Number(pagination.pageSize)"
      :total="count"
      :current-page="pagination.currentPage"
      :has-page-counter="false"
      position="top"
      @change-page-size="doChangePaginationPageSize"
    />
  </div>
  <div class="member-list-table panel">
    <app-member-list-toolbar></app-member-list-toolbar>
    <div class="-mx-6 -mt-6">
      <el-table
        ref="table"
        v-loading="loading"
        :data="rows"
        :default-sort="{
          prop: 'score',
          order: 'descending'
        }"
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
            <div class="flex items-start">
              <div
                v-if="scope.row.organizations.length > 0"
                class="w-5 h-5"
              >
                <img
                  v-if="organization[0].logo"
                  :src="organization[0].logo"
                  alt=""
                />
              </div>
              <div>
                <span
                  v-if="scope.row.organizations.length > 0"
                  >{{ organization[0].name }}</span
                >
                <span class="text-gray-500 text-2xs">{{
                  scope.row.attributes.jobTitle
                }}</span>
              </div>
            </div>
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

        <el-table-column label="Identities" width="200">
          <template #default="scope">
            <app-member-channels
              :member="scope.row"
            ></app-member-channels>
          </template>
        </el-table-column>

        <el-table-column
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
          :pager-count="11"
          :current-page="pagination.currentPage || 1"
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
import AppMemberDropdown from '../member-dropdown'
import AppMemberChannels from '../member-channels'
import AppTagList from '@/modules/tag/components/tag-list'
import AppMemberEngagementLevel from '../member-engagement-level'

const store = useStore()
const router = useRouter()
const table = ref(null)

const rows = computed(() => store.getters['member/rows'])
const count = computed(() => store.state.member.count)
const loading = computed(
  () => store.state.member.list.loading
)

const selectedRows = computed(
  () => store.getters['member/selectedRows']
)
const pagination = computed(
  () => store.getters['member/pagination']
)

onMounted(() => {
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

<style lang="scss">
.member-list-table {
  @apply relative;
  .el-table {
    @apply mt-0 border-t-0;

    .el-table-column--selection {
      .cell {
        @apply p-0 pl-4;
      }
    }

    .hover-row {
      cursor: pointer;
    }
  }
}
</style>
