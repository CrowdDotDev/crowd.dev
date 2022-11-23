<!-- Fix sorters -->
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
        <div class="app-list-table-panel">
          <app-organization-list-toolbar></app-organization-list-toolbar>

          <div class="-mx-6 -mt-6">
            <el-table
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
                  <div class="text-sm text-gray-500">
                    <a
                      :href="scope.row.url || null"
                      target="_blank"
                      >{{ scope.row.url }}</a
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
                  <div class="text-gray-900 text-sm">
                    {{
                      formatNumberToCompact(
                        scope.row.memberCount
                      )
                    }}
                  </div>
                </template>
              </el-table-column>

              <!-- Number of employees -->
              <el-table-column
                label="# Employees"
                width="150"
                prop="employees"
                sortable
                ><template #default="scope">
                  <div class="text-gray-900 text-sm">
                    {{
                      formatNumberToCompact(
                        scope.row.employees
                      )
                    }}
                  </div></template
                ></el-table-column
              >

              <!-- Active since -->
              <el-table-column
                label="Active since"
                width="200"
                prop="lastActive"
                sortable
                ><template #default="scope"
                  ><div class="text-gray-900 text-sm">
                    {{
                      formatDateToTimeAgo(
                        scope.row.lastActive
                      )
                    }}
                  </div></template
                ></el-table-column
              >

              <!-- Identities -->
              <el-table-column
                label="Identities"
                width="220"
                ><template #default="scope">
                  <app-organization-identities
                    :organization="scope.row"
                  ></app-organization-identities> </template
              ></el-table-column>
            </el-table>
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
import { computed, defineProps } from 'vue'
import { useRouter } from 'vue-router'
import {
  mapState,
  mapGetters,
  mapActions
} from '@/shared/vuex/vuex.helpers'
import { formatDateToTimeAgo } from '@/utils/date'
import { formatNumberToCompact } from '@/utils/number'
import AppOrganizationIdentities from '../organization-identities'
import AppOrganizationListToolbar from './organization-list-toolbar'
import AppOrganizationName from '../organization-name'

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

const {
  count,
  list: { loading }
} = mapState('organization')
const { activeView, rows, pagination, selectedRows } =
  mapGetters('organization')
const { doChangePaginationPageSize, doChangeSort } =
  mapActions('organization')

const defaultSort = computed(() => {
  return activeView.value.sorter
})
const isLoading = computed(
  () => loading.value || props.isPageLoading
)

const onCtaClick = () => {
  router.push({
    name: 'organizationCreate'
  })
}

const onRowClick = (row) => {
  router.push({
    name: 'memberView',
    params: { id: row.id }
  })
}

const rowClass = ({ row }) => {
  const isSelected =
    selectedRows.value.find((r) => r.id === row.id) !==
    undefined

  return isSelected ? 'is-selected' : ''
}
</script>
