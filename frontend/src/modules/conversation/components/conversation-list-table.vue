<template>
  <div class="conversation-list-table panel">
    <app-conversation-list-toolbar></app-conversation-list-toolbar>
    <div class="-mx-6 -mt-4">
      <el-table
        ref="table"
        v-loading="loading('table')"
        :data="conversations"
        row-key="id"
        :default-sort="{
          prop: 'lastActive',
          order: 'descending'
        }"
        :row-class-name="rowClass"
        @sort-change="doChangeSort"
      >
        <el-table-column
          type="selection"
          width="75"
        ></el-table-column>

        <el-table-column
          label="Title"
          prop="title"
          sortable="custom"
        >
          <template #default="scope">
            <router-link
              :to="{
                name: 'conversationView',
                params: { id: scope.row.id }
              }"
              class="flex items-center text-black"
            >
              <div class="font-semibold truncate">
                {{ scope.row.title }}
              </div>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column width="150">
          <template #header>
            <span class="inline-flex items-center">
              <span class="inline-flex mr-1">Status</span>
              <el-tooltip placement="top">
                <template #content>
                  Published conversations will be available
                  within community's help center
                </template>
                <i
                  class="ri-information-line inline-flex items-center mr-2"
                ></i>
              </el-tooltip>
            </span>
          </template>
          <template #default="scope">
            {{
              scope.row.published
                ? 'Published'
                : 'Unpublished'
            }}
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
          label="Platform"
          prop="platform"
          width="150"
        >
          <template #default="scope">
            <span
              v-if="scope.row.platform === 'github'"
              class="btn btn--circle btn--github mr-2"
              ><img
                :src="findIcon('github')"
                alt="Github"
                class="conversation-list-table--platform-icon"
              />
            </span>
            <span
              v-else-if="scope.row.platform === 'discord'"
              class="btn btn--circle btn--discord mr-2"
              ><img
                :src="findIcon('discord')"
                alt="Discord"
                class="conversation-list-table--platform-icon"
            /></span>
            <span
              v-else-if="scope.row.platform === 'slack'"
              class="btn btn--circle btn--slack mr-2"
              ><img
                :src="findIcon('slack')"
                alt="Slack"
                class="conversation-list-table--platform-icon"
            /></span>
            <span
              v-else-if="scope.row.platform === 'devto'"
              class="btn btn--circle btn--devto mr-2"
              ><img
                :src="findIcon('devto')"
                alt="DEV"
                class="conversation-list-table--platform-icon"
            /></span>
          </template>
        </el-table-column>
        <el-table-column
          label="Channel"
          prop="channel"
          width="150"
        >
          <template #header>
            <span class="inline-flex items-center">
              <span class="inline-flex mr-1">Channel</span>
              <el-tooltip placement="top">
                <template #content>
                  Channel corresponds to channel (in Discord
                  and Slack) or repo (in GitHub)
                </template>
                <i
                  class="ri-information-line inline-flex items-center mr-2"
                ></i>
              </el-tooltip>
            </span>
          </template>
          <template #default="scope">
            {{ scope.row.channel }}
          </template>
        </el-table-column>
        <el-table-column label="" width="120">
          <template #default="scope">
            <div class="table-actions">
              <app-conversation-dropdown
                :conversation="scope.row"
              ></app-conversation-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="el-pagination-wrapper px-3">
        <el-pagination
          :current-page="pagination.currentPage || 1"
          :disabled="loading('table')"
          :layout="paginationLayout"
          :total="count"
          :page-size="20"
          :page-sizes="[20, 50, 100, 200]"
          @current-change="doChangePaginationCurrentPage"
          @size-change="doChangePaginationPageSize"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import { ConversationModel } from '@/modules/conversation/conversation-model'
import { mapGetters, mapActions } from 'vuex'
import { ConversationPermissions } from '@/modules/conversation/conversation-permissions'
import { i18n } from '@/i18n'
import ConversationDropdown from './conversation-dropdown'
import ConversationListDropdown from './conversation-list-toolbar'
import computedTimeAgo from '@/utils/time-ago'
import integrationsJsonArray from '@/jsons/integrations.json'

const { fields } = ConversationModel

export default {
  name: 'AppConversationListTable',
  components: {
    'app-conversation-dropdown': ConversationDropdown,
    'app-conversation-list-toolbar':
      ConversationListDropdown
  },

  computed: {
    ...mapGetters({
      rows: 'conversation/rows',
      count: 'conversation/count',
      loading: 'conversation/loading',
      pagination: 'conversation/pagination',
      selectedRows: 'conversation/selectedRows',
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
      doChangeSort: 'conversation/doChangeSort',
      doChangePaginationCurrentPage:
        'conversation/doChangePaginationCurrentPage',
      doChangePaginationPageSize:
        'conversation/doChangePaginationPageSize',
      doMountTable: 'conversation/doMountTable',
      doDestroy: 'communityMember/destroy/doDestroy'
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
    }
  }
}
</script>

<style lang="scss">
.conversation-list-table {
  @apply relative;
  .el-table {
    @apply mt-0 border-t-0;

    th {
      @apply pb-4;
    }

    .el-table-column--selection {
      .cell {
        @apply p-0 pl-4;
      }
    }
  }

  &--platform-icon {
    @apply w-4 h-4;
  }
}
</style>
