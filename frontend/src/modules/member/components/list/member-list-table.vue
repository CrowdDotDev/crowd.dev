<template>
  <div class="pt-3">
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5"
    ></div>
    <div v-else>
      <!-- Empty State -->
      <app-empty-state-cta
        v-if="!hasIntegrations && !hasMembers"
        icon="ri-contacts-line"
        title="No community members yet"
        description="Please connect with one of our available data sources in order to start pulling data from a certain platform"
        cta-btn="Connect integrations"
        secondary-btn="Add member"
        @cta-click="onCtaClick"
        @secondary-click="onSecondaryBtnClick"
      ></app-empty-state-cta>

      <app-empty-state-cta
        v-else-if="hasIntegrations && !hasMembers"
        icon="ri-contacts-line"
        title="No community members yet"
        description="Please consider that the first members may take a couple of minutes to be displayed"
        :has-warning-icon="true"
      ></app-empty-state-cta>

      <app-empty-state-cta
        v-else-if="hasMembers && !count"
        icon="ri-contacts-line"
        title="No members found"
        description="We couldn't find any results that match your search criteria, please try a different query"
      ></app-empty-state-cta>

      <div v-else>
        <!-- Sorter -->
        <div class="mb-2">
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

        <!-- Members list -->
        <div class="app-list-table panel">
          <transition name="el-fade-in">
            <div
              v-show="isTableHovered"
              class="absolute z-10 top-0 left-0 w-full"
              @mouseover="isTableHovered = true"
            >
              <el-scrollbar
                id="custom-scrollbar"
                ref="scrollbarRef"
                wrap-class="custom-scrollbar-class"
                height="10px"
                always
                @scroll="scroll"
              >
                <div
                  :style="{
                    width: tableWidth,
                    height: '10px'
                  }"
                ></div>
              </el-scrollbar>
            </div>
          </transition>
          <app-member-list-toolbar
            @mouseover="onmouseover"
          ></app-member-list-toolbar>
          <div class="-mx-6 -mt-6" @mouseover="onmouseover">
            <el-table
              id="members-table"
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
                width="250"
                sortable
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
                    <app-member-sentiment
                      :member="scope.row"
                      class="ml-2"
                    />
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
                      ? column.formatter(
                          scope.row[column.name]
                        )
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
                  <app-member-last-activity
                    v-if="scope.row.lastActivity"
                    :member="scope.row"
                  />
                </template>
              </el-table-column>
              <el-table-column
                v-if="showReach"
                label="Reach"
                prop="reach.total"
                width="150"
                sortable="custom"
              >
                <template #default="scope">
                  <app-member-reach
                    :member="{
                      ...scope.row,
                      reach: scope.row.reach
                    }"
                  />
                </template>
              </el-table-column>

              <el-table-column
                label="Identities"
                width="220"
              >
                <template #default="scope">
                  <app-member-channels
                    :member="scope.row"
                  ></app-member-channels>
                </template>
              </el-table-column>

              <el-table-column
                :width="maxTabWidth"
                :label="
                  translate('entities.member.fields.tag')
                "
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
                @change-page-size="
                  doChangePaginationPageSize
                "
              />
            </div>
          </div>
        </div>
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
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  defineProps,
  watch
} from 'vue'
import AppMemberListToolbar from '@/modules/member/components/list/member-list-toolbar.vue'
import AppMemberOrganizations from '@/modules/member/components/member-organizations.vue'
import AppMemberDropdown from '../member-dropdown'
import AppMemberChannels from '../member-channels'
import AppMemberReach from '../member-reach.vue'
import AppTagList from '@/modules/tag/components/tag-list'
import AppMemberEngagementLevel from '../member-engagement-level'
import AppMemberLastActivity from '../member-last-activity'
import AppMemberSentiment from '../member-sentiment'

const store = useStore()
const router = useRouter()
const table = ref(null)
const scrollbarRef = ref()
const isTableHovered = ref(false)
const tableBody = ref()
const tableHeader = ref()
const cursorDown = ref(false)
const thumb = ref()

const props = defineProps({
  hasIntegrations: {
    type: Boolean,
    default: () => false
  },
  hasMembers: {
    type: Boolean,
    default: () => false
  },
  isPageLoading: {
    type: Boolean,
    default: () => true
  }
})

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
  return (
    integrations.value.twitter?.status === 'done' ||
    integrations.value.github?.status === 'done'
  )
})

const rows = computed(() => store.getters['member/rows'])
const count = computed(() => store.state.member.count)
const tableWidth = computed(() => {
  return store.state.member.list.table?.bodyWidth
})
const loading = computed(
  () =>
    store.state.member.list.loading || props.isPageLoading
)

const maxTabWidth = computed(() => {
  let maxTabWidth = 0
  for (const row of rows.value) {
    if (row.tags) {
      const tabWidth = row.tags
        .map((tag) => tag.name.length * 20)
        .reduce((a, b) => a + b, 0)

      if (tabWidth > maxTabWidth) {
        maxTabWidth = tabWidth
      }
    }
  }

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
})

document.onmouseup = () => {
  console.log('up', { cursorDown: cursorDown.value })
  cursorDown.value = false
}

onUnmounted(() => {
  tableBody.value.removeEventListener(
    'scroll',
    onTableBodyScroll
  )
  tableHeader.value.removeEventListener(
    'scroll',
    onTableHeaderScroll
  )
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
watch(table, (newValue) => {
  const tableBodyEl = document.querySelector(
    '#members-table .el-scrollbar__wrap'
  )
  const tableHeaderEl = document.querySelector(
    '#members-table .el-table__header-wrapper'
  )

  if (tableBodyEl) {
    tableBody.value = tableBodyEl
    tableBody.value.addEventListener(
      'scroll',
      onTableBodyScroll
    )
  }

  if (tableHeaderEl) {
    tableHeaderEl.style.overflow = 'auto'
    tableHeader.value = tableHeaderEl
    tableHeader.value.addEventListener(
      'scroll',
      onTableHeaderScroll
    )
  }

  if (newValue) {
    store.dispatch('member/doMountTable', table.value)
  }
})

watch(scrollbarRef, (newValue) => {
  if (newValue) {
    const thumbEl = document.querySelector(
      '.custom-scrollbar-class'
    )

    thumb.value = thumbEl
    thumb.value.addEventListener('mousedown', () => {
      console.log('down')
    })
  }
})

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

function onCtaClick() {
  router.push({
    path: '/integrations'
  })
}

function onSecondaryBtnClick() {
  router.push({
    name: 'memberCreate'
  })
}

function scroll({ scrollLeft }) {
  table.value.setScrollLeft(scrollLeft)
}

function onTableBodyScroll() {
  scrollbarRef.value.setScrollLeft(
    tableBody.value.scrollLeft
  )
}

function onTableHeaderScroll() {
  scrollbarRef.value.setScrollLeft(
    tableHeader.value.scrollLeft
  )
  table.value.setScrollLeft(tableHeader.value.scrollLeft)
}

const onmouseover = () => {
  isTableHovered.value = true
  // const el = document.querySelector(
  //   '#custom-scrollbar .el-scrollbar__bar.is-horizontal'
  // )

  // el.style.display = 'block'
}
</script>

<style lang="scss">
#members-table .el-table__header-wrapper {
  // IE, Edge and Firefox
  -ms-overflow-style: none;
  scrollbar-width: none;

  // Chrome, Safari and Opera
  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
