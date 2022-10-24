<template>
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
            <span v-else class="badge">Unpublished</span>
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
                  Channel corresponds to a proper channel
                  (in Discord and Slack), or a repo (in
                  GitHub)
                </template>
                <i
                  class="ri-information-line inline-flex items-center mr-2"
                ></i>
              </el-tooltip>
            </span>
          </template>
          <template #default="scope">
            <div class="flex items-center">
              <span
                v-if="scope.row.platform === 'github'"
                class="btn btn--circle btn--github mr-2"
                ><img
                  :src="findIcon('github')"
                  alt="Github"
                  class="w-4 h-4"
                />
              </span>
              <span
                v-else-if="scope.row.platform === 'discord'"
                class="btn btn--circle btn--discord mr-2"
                ><img
                  :src="findIcon('discord')"
                  alt="Discord"
                  class="w-4 h-4"
              /></span>
              <span
                v-else-if="scope.row.platform === 'slack'"
                class="btn btn--circle btn--slack mr-2"
                ><img
                  :src="findIcon('slack')"
                  alt="Slack"
                  class="w-4 h-4"
              /></span>
              <span
                v-else-if="scope.row.platform === 'devto'"
                class="btn btn--circle btn--devto mr-2"
                ><img
                  :src="findIcon('devto')"
                  alt="DEV"
                  class="w-4 h-4"
              /></span>
              {{ scope.row.channel }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="" width="70" fixed="right">
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
          module="conversation"
          @change-current-page="
            doChangePaginationCurrentPage
          "
          @change-page-size="doChangePaginationPageSize"
        />
      </div>
    </div>
    <app-community-help-center-conversation-drawer
      :expanded="drawerConversationId !== null"
      :conversation-id="drawerConversationId"
      @close="drawerConversationId = null"
    ></app-community-help-center-conversation-drawer>
  </div>
</template>

<script>
import { ConversationModel } from '@/modules/conversation/conversation-model'
import { mapGetters, mapActions, mapState } from 'vuex'
import { ConversationPermissions } from '@/modules/conversation/conversation-permissions'
import { i18n } from '@/i18n'
import ConversationDropdown from '../../conversation/components/conversation-dropdown'
import CommunityHelpCenterToolbar from '../../community-help-center/components/community-help-center-toolbar'
import computedTimeAgo from '@/utils/time-ago'
import integrationsJsonArray from '@/jsons/integrations.json'
import AppCommunityHelpCenterConversationDrawer from '@/modules/community-help-center/components/community-help-center-conversation-drawer'

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
      drawerConversationId: null
    }
  },

  computed: {
    ...mapState({
      loading: (state) =>
        state.communityHelpCenter.list.loading,
      count: (state) => state.communityHelpCenter.list.count
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
    this.doMountTable(this.$refs.table)
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
      return computedTimeAgo(date)
    },

    findIcon(platform) {
      return integrationsJsonArray.find(
        (i) => i.platform === platform
      ).image
    },

    handleRowClick(row) {
      this.drawerConversationId = row.id
    }
  }
}
</script>
