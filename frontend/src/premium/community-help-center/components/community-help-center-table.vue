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
              :data="conversations"
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
import { ConversationModel } from '@/modules/conversation/conversation-model'
import { mapGetters, mapActions, mapState } from 'vuex'
import { ConversationPermissions } from '@/modules/conversation/conversation-permissions'
import { i18n } from '@/i18n'
import ConversationDropdown from '../../../modules/conversation/components/conversation-dropdown'
import CommunityHelpCenterToolbar from './community-help-center-toolbar'
import { formatDateToTimeAgo } from '@/utils/date'
import AppCommunityHelpCenterConversationDrawer from '@/premium/community-help-center/components/community-help-center-conversation-drawer'

const { fields } = ConversationModel

export default {
  name: 'AppConversationListTable',
  components: {
    AppCommunityHelpCenterConversationDrawer,
    'app-conversation-dropdown': ConversationDropdown,
    'app-community-help-center-toolbar':
      CommunityHelpCenterToolbar
  },

  data() {
    return {
      drawerConversationId: null,
      mountTableInterval: null
    }
  },

  computed: {
    ...mapState({
      filters: (state) =>
        state.communityHelpCenter.filter.attributes,
      loading: (state) =>
        state.communityHelpCenter.list.loading,
      count: (state) => state.communityHelpCenter.count
    }),
    ...mapGetters({
      rows: 'communityHelpCenter/rows',
      pagination: 'communityHelpCenter/pagination',
      selectedRows: 'communityHelpCenter/selectedRows',
      isMobile: 'layout/isMobile',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      paginationLayout: 'layout/paginationLayout'
    }),

    activeTab() {
      return this.$route.query.activeTab || ''
    },

    hasFilter() {
      const parsedFilters = { ...this.filters }

      // Remove published and unpublished filters has they are the default view
      delete parsedFilters.published
      delete parsedFilters.unpublished

      // Remove search filter if value is empty
      if (!parsedFilters.search?.value) {
        delete parsedFilters.search
      }

      return !!Object.keys(parsedFilters).length
    },

    emptyState() {
      if (this.hasFilter) {
        return {
          title: `No ${this.activeTab} conversations found`,
          description:
            "We couldn't find any results that match your search criteria, please try a different query"
        }
      }

      // Default view
      const title = `No ${this.activeTab} conversations yet`
      let description =
        "We couldn't track any conversations among your community members"

      // Published view
      if (this.activeTab === 'published') {
        description =
          'Start publishing conversations in order to feed your Community Help Center'
        // Unpublished view
      } else if (this.activeTab === 'unpublished') {
        description =
          "We couldn't find any unpublished conversations"
      }

      return {
        title,
        description
      }
    },

    hasPermissionToEdit() {
      return new ConversationPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },

    hasPermissionToDestroy() {
      return new ConversationPermissions(
        this.currentTenant,
        this.currentUser
      ).destroy
    },

    fields() {
      return fields
    },

    conversations() {
      return [...this.rows]
    }
  },

  mounted() {
    this.mountTableInterval = setInterval(
      this.doMountTableInterval,
      1000
    )
  },

  methods: {
    ...mapActions({
      doChangeSort: 'communityHelpCenter/doChangeSort',
      doChangePaginationCurrentPage:
        'communityHelpCenter/doChangePaginationCurrentPage',
      doChangePaginationPageSize:
        'communityHelpCenter/doChangePaginationPageSize',
      doMountTable: 'communityHelpCenter/doMountTable'
    }),

    doRefresh() {
      this.doChangePaginationCurrentPage()
    },

    presenter(row, fieldName) {
      return ConversationModel.presenter(row, fieldName)
    },

    translate(key) {
      return i18n(key)
    },

    rowClass({ row }) {
      const isSelected =
        this.selectedRows.find((r) => r.id === row.id) !==
        undefined
      return isSelected ? 'is-selected' : ''
    },
    timeAgo(date) {
      return formatDateToTimeAgo(date)
    },

    handleRowClick(row) {
      this.drawerConversationId = row.id
    },

    doMountTableInterval() {
      // TODO: Need to refactor this component to options api and this method to watch instead of setInterval
      if (
        this.$refs.table !==
        this.$store.state.communityHelpCenter.list.table
      ) {
        this.doMountTable(this.$refs.table)
        clearInterval(this.mountTableInterval)
      }
    }
  }
}
</script>
