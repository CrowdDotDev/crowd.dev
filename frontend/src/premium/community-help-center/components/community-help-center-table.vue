<template>
  <div class="pt-3">
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5"
    ></div>
    <div v-else>
      <!-- Empty state -->
      <app-empty-state-cta
        v-if="!count"
        icon="ri-question-answer-line"
        :title="emptyState.title"
        :description="emptyState.description"
      ></app-empty-state-cta>

      <div v-else>
        <!-- Sorter -->
        <div class="mb-2">
          <app-pagination-sorter
            :page-size="Number(pagination.pageSize)"
            :total="count"
            :current-page="pagination.currentPage"
            :has-page-counter="false"
            module="community-help-center"
            position="top"
            @change-sorter="doChangePaginationPageSize"
          />
        </div>

        <!-- Conversations list -->
        <div class="app-list-table panel">
          <app-community-help-center-toolbar></app-community-help-center-toolbar>
          <div class="-mx-6 -mt-4">
            <el-table
              ref="table"
              v-loading="loading"
              :data="rows"
              row-key="id"
              border
              :default-sort="{
                prop: 'lastActive',
                order: 'descending'
              }"
              :row-class-name="rowClass"
              @sort-change="doChangeSort"
              @row-click="handleRowClick"
            >
              <el-table-column
                type="selection"
                width="75"
              ></el-table-column>
              <el-table-column width="150" label="Status">
                <template #default="scope">
                  <span
                    v-if="scope.row.published"
                    class="badge badge--green"
                    >Published</span
                  >
                  <span v-else class="badge"
                    >Unpublished</span
                  >
                </template>
              </el-table-column>
              <el-table-column
                label="Conversation title"
                prop="title"
                sortable="custom"
              >
                <template #default="scope">
                  <div class="font-semibold truncate">
                    {{ scope.row.title }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                width="180"
                label="# of Activities"
                prop="activityCount"
                sortable="custom"
              >
                <template #default="scope">
                  {{ scope.row.activityCount }}
                </template>
              </el-table-column>
              <el-table-column
                width="180"
                label="Last active"
                prop="lastActive"
                sortable="custom"
              >
                <template #default="scope">
                  {{ timeAgo(scope.row.lastActive) }}
                </template>
              </el-table-column>

              <el-table-column
                label="Platform/channel"
                prop="platform"
                width="200"
              >
                <template #header>
                  <span class="inline-flex items-center">
                    <span class="inline-flex mr-1"
                      >Platform/Channel</span
                    >
                    <el-tooltip placement="top">
                      <template #content>
                        Channel corresponds to a proper
                        channel (in Discord and Slack), or a
                        repo (in GitHub)
                      </template>
                      <i
                        class="ri-information-line inline-flex items-center mr-2"
                      ></i>
                    </el-tooltip>
                  </span>
                </template>
                <template #default="scope">
                  <div class="flex items-center">
                    <app-platform
                      v-if="scope.row.platform === 'github'"
                      platform="github"
                      platform-name="Github"
                    />
                    <app-platform
                      v-else-if="
                        scope.row.platform === 'discord'
                      "
                      platform="discord"
                      platform-name="Discord"
                    />
                    <app-platform
                      v-else-if="
                        scope.row.platform === 'slack'
                      "
                      platform="slack"
                      platform-name="Slack"
                    />
                    <app-platform
                      v-else-if="
                        scope.row.platform === 'devto'
                      "
                      platform="devto"
                      platform-name="DEV"
                    />
                    <app-platform
                      v-else-if="
                        scope.row.platform === 'twitter'
                      "
                      platform="twitter"
                      platform-name="Twitter"
                    />
                    <span class="ml-2">{{
                      scope.row.channel
                    }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                label=""
                width="70"
                fixed="right"
              >
                <template #default="scope">
                  <div class="table-actions">
                    <app-conversation-dropdown
                      :conversation="scope.row"
                    ></app-conversation-dropdown>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <div v-if="!!count" class="mt-8 px-6">
              <app-pagination
                :total="count"
                :page-size="Number(pagination.pageSize)"
                :current-page="pagination.currentPage || 1"
                module="community-help-center"
                @change-current-page="
                  doChangePaginationCurrentPage
                "
                @change-page-size="
                  doChangePaginationPageSize
                "
              />
            </div>
          </div>
          <app-community-help-center-conversation-drawer
            :expanded="drawerConversationId !== null"
            :conversation-id="drawerConversationId"
            @close="drawerConversationId = null"
          ></app-community-help-center-conversation-drawer>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppCommunityHelpCenterTable'
}
</script>

<script setup>
import { defineEmits, ref, watch, computed } from 'vue'
import { useStore } from 'vuex'

import { formatDateToTimeAgo } from '@/utils/date'
import AppConversationDropdown from '@/modules/conversation/components/conversation-dropdown'
import AppCommunityHelpCenterToolbar from './community-help-center-toolbar'
import AppCommunityHelpCenterConversationDrawer from '@/premium/community-help-center/components/community-help-center-conversation-drawer'

const store = useStore()
defineEmits(['cta-click'])

const table = ref(null)
const drawerConversationId = ref(null)

const loading = computed(
  () => store.state.communityHelpCenter.list.loading
)
const count = computed(
  () => store.state.communityHelpCenter.count
)
const rows = computed(
  () => store.getters['communityHelpCenter/rows']
)
const selectedRows = computed(
  () => store.getters['communityHelpCenter/selectedRows']
)
const pagination = computed(
  () => store.getters['communityHelpCenter/pagination']
)

const activeView = computed(
  () => store.getters['communityHelpCenter/activeView']
)

const hasFilter = computed(() => {
  const parsedFilters = {
    ...activeView.value.filter.attributes
  }
  // Remove published and unpublished filters has they are the default view
  delete parsedFilters.published
  delete parsedFilters.unpublished
  // Remove search filter if value is empty
  if (!parsedFilters.search?.value) {
    delete parsedFilters.search
  }
  return !!Object.keys(parsedFilters).length
})

const emptyState = computed(() => {
  if (hasFilter.value) {
    return {
      title: `No ${activeView.value.id} conversations found`,
      description:
        "We couldn't find any results that match your search criteria, please try a different query"
    }
  }
  // Default view
  const title = `No ${activeView.value.id} conversations yet`
  let description =
    "We couldn't track any conversations among your community members"
  // Published view
  if (activeView.value.id === 'published') {
    description =
      'Start publishing conversations in order to feed your Community Help Center'
    // Unpublished view
  } else if (activeView.value.id === 'unpublished') {
    description =
      "We couldn't find any unpublished conversations"
  }
  return {
    title,
    description
  }
})

watch(table, (newValue) => {
  if (newValue) {
    store.dispatch(
      'communityHelpCenter/doMountTable',
      table.value
    )
  }
})

function doChangeSort(sorter) {
  store.dispatch('communityHelpCenter/doChangeSort', sorter)
}

function doChangePaginationCurrentPage(currentPage) {
  store.dispatch(
    'communityHelpCenter/doChangePaginationCurrentPage',
    currentPage
  )
}

function doChangePaginationPageSize(pageSize) {
  store.dispatch(
    'communityHelpCenter/doChangePaginationPageSize',
    pageSize
  )
}

function rowClass({ row }) {
  const isSelected =
    selectedRows.value.find((r) => r.id === row.id) !==
    undefined

  return isSelected ? 'is-selected' : ''
}

function handleRowClick(row) {
  drawerConversationId.value = row.id
}

function timeAgo(date) {
  return formatDateToTimeAgo(date)
}
</script>
