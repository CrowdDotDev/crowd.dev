<template>
  <div class="pt-3">
    <div
      v-if="isLoading"
      v-loading="isLoading"
      class="app-page-spinner h-16 !relative !min-h-5"
    ></div>
    <div v-else>
      <!-- Empty State -->
      <app-empty-state-cta
        v-if="!hasOrganizations"
        icon="ri-community-line"
        title="No organizations yet"
        description="We coulnd't track any organizations related to your community members"
        cta-btn="Add organization"
        @cta-click="onCtaClick"
      ></app-empty-state-cta>

      <app-empty-state-cta
        v-else-if="hasOrganizations && !count"
        icon="ri-community-line"
        title="No organizations found"
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
            module="organization"
            position="top"
            @change-sorter="doChangePaginationPageSize"
          />
        </div>

        <!-- Organizations list -->
        <div class="app-list-table panel">
          <transition name="el-fade-in">
            <div
              v-show="isScrollbarVisible"
              class="absolute z-20 top-0 left-0 w-full"
              @mouseover="onTableMouseover"
              @mouseleave="onTableMouseLeft"
            >
              <el-scrollbar
                id="custom-scrollbar"
                ref="scrollbarRef"
                height="10px"
                always
                @scroll="onCustomScrollbarScroll"
                @pointerdown="onScrollMousedown"
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

          <app-organization-list-toolbar
            @mouseover="onTableMouseover"
            @mouseleave="onTableMouseLeft"
          ></app-organization-list-toolbar>

          <div
            class="-mx-6 -mt-6"
            @mouseover="onTableMouseover"
            @mouseleave="onTableMouseLeft"
          >
            <el-table
              id="organizations-table"
              ref="table"
              :data="rows"
              :default-sort="defaultSort"
              row-key="id"
              border
              :row-class-name="rowClass"
              @sort-change="doChangeSort"
              @row-click="onRowClick"
            >
              <!-- Checkbox -->
              <el-table-column
                type="selection"
                width="75"
                fixed
              >
              </el-table-column>

              <!-- Organization logo and name -->
              <el-table-column
                label="Organization"
                prop="name"
                width="260"
                sortable
                fixed
              >
                <template #default="scope">
                  <app-organization-name
                    :organization="scope.row"
                  ></app-organization-name>
                </template>
              </el-table-column>

              <!-- Website -->
              <el-table-column label="Website" width="220">
                <template #default="scope">
                  <div
                    class="text-sm h-full flex items-center"
                  >
                    <a
                      v-if="scope.row.website"
                      class="text-gray-500 hover:!text-brand-500"
                      :href="withHttp(scope.row.website)"
                      target="_blank"
                      @click.stop
                      >{{ scope.row.website }}</a
                    >
                    <span v-else class="text-gray-500"
                      >-</span
                    >
                  </div>
                </template>
              </el-table-column>

              <!-- Number of members -->
              <el-table-column
                label="# Members"
                width="150"
                prop="memberCount"
                sortable
              >
                <template #default="scope">
                  <div
                    class="text-gray-900 text-sm h-full flex items-center"
                  >
                    {{
                      formatNumberToCompact(
                        scope.row.memberCount
                      )
                    }}
                  </div>
                </template>
              </el-table-column>

              <!-- Number of employees 
              TODO: Uncomment when we support enrichment
              <el-table-column
                label="# Employees"
                width="150"
                prop="employees"
                sortable
                ><template #default="scope">
                  <div class="text-gray-900 text-sm">
                    {{
                      formatNumberToRange(
                        scope.row.employees
                      )
                    }}
                  </div></template
                ></el-table-column
              >
              -->

              <!-- Number of activities -->
              <el-table-column
                label="# Activities"
                width="150"
                prop="activityCount"
                sortable
                ><template #default="scope">
                  <div
                    class="text-gray-900 text-sm h-full flex items-center"
                  >
                    {{
                      formatNumberToCompact(
                        scope.row.activityCount
                      )
                    }}
                  </div></template
                ></el-table-column
              >

              <!-- Joined Date -->
              <el-table-column
                label="Joined Date"
                width="200"
                prop="joinedAt"
                sortable
                ><template #default="scope"
                  ><div
                    v-if="scope.row.joinedAt"
                    class="text-gray-900 text-sm h-full flex items-center"
                  >
                    {{
                      formatDateToTimeAgo(
                        scope.row.joinedAt
                      )
                    }}
                  </div>
                  <span v-else class="text-gray-900"
                    >-</span
                  ></template
                ></el-table-column
              >

              <!-- Identities -->
              <el-table-column
                label="Identities"
                width="270"
                ><template #default="scope">
                  <div class="h-full flex items-center">
                    <app-organization-identities
                      v-if="hasIdentities(scope.row)"
                      :organization="scope.row"
                    ></app-organization-identities>
                    <span v-else class="text-gray-900"
                      >-</span
                    >
                  </div>
                </template>
              </el-table-column>

              <!-- Actions -->
              <el-table-column fixed="right">
                <template #default="scope">
                  <div class="table-actions">
                    <app-organization-dropdown
                      :organization="scope.row"
                    ></app-organization-dropdown>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <div
              v-if="showBottomPagination"
              class="mt-8 px-6"
            >
              <app-pagination
                :total="count"
                :page-size="Number(pagination.pageSize)"
                :current-page="pagination.currentPage || 1"
                module="organization"
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
  name: 'AppOrganizationListTable'
}
</script>

<script setup>
import {
  computed,
  defineProps,
  ref,
  watch,
  onUnmounted
} from 'vue'
import { useRouter } from 'vue-router'
import {
  mapState,
  mapGetters,
  mapActions
} from '@/shared/vuex/vuex.helpers'
import { formatDateToTimeAgo } from '@/utils/date'
import { formatNumberToCompact } from '@/utils/number'
import { withHttp } from '@/utils/string'
import AppOrganizationIdentities from '../organization-identities'
import AppOrganizationListToolbar from './organization-list-toolbar'
import AppOrganizationName from '../organization-name'
import AppOrganizationDropdown from '../organization-dropdown'

const router = useRouter()

const props = defineProps({
  hasOrganizations: {
    type: Boolean,
    default: () => false
  },
  isPageLoading: {
    type: Boolean,
    default: () => true
  }
})

const { count, list } = mapState('organization')
const { activeView, rows, pagination, selectedRows } =
  mapGetters('organization')
const {
  doChangePaginationCurrentPage,
  doChangePaginationPageSize,
  doChangeSort,
  doMountTable
} = mapActions('organization')

const table = ref(null)
const scrollbarRef = ref()
const tableBodyRef = ref()
const tableHeaderRef = ref()
const isScrollbarVisible = ref(false)
const isTableHovered = ref(false)
const isCursorDown = ref(false)

const showBottomPagination = computed(() => {
  return (
    !!count.value &&
    Math.ceil(
      count.value / Number(pagination.value.pageSize)
    ) > 1
  )
})
const tableWidth = computed(() => {
  return list.value.table?.bodyWidth
})
const defaultSort = computed(() => {
  return activeView.value.sorter
})
const isLoading = computed(
  () => list.value.loading || props.isPageLoading
)

document.onmouseup = () => {
  // As soon as mouse is released, set scrollbar visibility
  // according to wether the mouse is hovering the table or not
  isScrollbarVisible.value = isTableHovered.value
  isCursorDown.value = false
}

watch(table, (newValue) => {
  if (newValue) {
    doMountTable(table.value)
  }

  // Add scroll events to table, it's not possible to access it from 'el-table'
  // as the overflowed element is within it
  const tableBodyEl = document.querySelector(
    '#organizations-table .el-scrollbar__wrap'
  )
  const tableHeaderEl = document.querySelector(
    '#organizations-table .el-table__header-wrapper'
  )

  if (tableBodyEl) {
    tableBodyRef.value = tableBodyEl
    tableBodyRef.value.addEventListener(
      'scroll',
      onTableBodyScroll
    )
  }

  if (tableHeaderEl) {
    tableHeaderEl.style.overflow = 'auto'
    tableHeaderRef.value = tableHeaderEl
    tableHeaderRef.value.addEventListener(
      'scroll',
      onTableHeaderScroll
    )
  }
})

// Remove listeners on unmount
onUnmounted(() => {
  tableBodyRef.value?.removeEventListener(
    'scroll',
    onTableBodyScroll
  )
  tableHeaderRef.value?.removeEventListener(
    'scroll',
    onTableHeaderScroll
  )
})

const onCtaClick = () => {
  router.push({
    name: 'organizationCreate'
  })
}

const onRowClick = (row) => {
  router.push({
    name: 'organizationView',
    params: { id: row.id }
  })
}

const rowClass = ({ row }) => {
  const isSelected =
    selectedRows.value.find((r) => r.id === row.id) !==
    undefined

  return isSelected ? 'is-selected' : ''
}

const hasIdentities = (row) => {
  return (
    !!row.github ||
    !!row.linkedin ||
    !!row.twitter ||
    !!row.crunchbase ||
    !!row.emails?.length ||
    !!row.phoneNumbers?.length
  )
}

// On custom scrollbar scroll, set the table scroll with the same value
const onCustomScrollbarScroll = ({ scrollLeft }) => {
  table.value.setScrollLeft(scrollLeft)
}

// On table body scroll, set the custom scrollbar scroll with the same value
const onTableBodyScroll = () => {
  scrollbarRef.value.setScrollLeft(
    tableBodyRef.value.scrollLeft
  )
}

// On table header scroll, set the custom scrollbar scroll with the same value
const onTableHeaderScroll = () => {
  scrollbarRef.value.setScrollLeft(
    tableHeaderRef.value.scrollLeft
  )
  table.value.setScrollLeft(tableHeaderRef.value.scrollLeft)
}

const onScrollMousedown = () => {
  isCursorDown.value = true
}

const onTableMouseover = () => {
  isTableHovered.value = true
  isScrollbarVisible.value = true
}

const onTableMouseLeft = () => {
  isTableHovered.value = false
  isScrollbarVisible.value = isCursorDown.value
}
</script>

<style lang="scss">
// Hide table header scrollbar
#organizations-table .el-table__header-wrapper {
  // IE, Edge and Firefox
  -ms-overflow-style: none;
  scrollbar-width: none;

  // Chrome, Safari and Opera
  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
