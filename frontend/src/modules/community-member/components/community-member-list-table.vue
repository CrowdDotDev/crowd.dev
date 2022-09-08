<template>
  <div class="community-member-list-table panel">
    <app-community-member-list-toolbar></app-community-member-list-toolbar>
    <div class="-mx-6 -mt-4">
      <el-table
        ref="table"
        v-loading="loading"
        :data="members"
        :default-sort="{
          prop: 'score',
          order: 'descending'
        }"
        row-key="id"
        border
        :row-class-name="rowClass"
        @sort-change="doChangeSort"
      >
        <el-table-column
          type="selection"
          width="75"
        ></el-table-column>

        <el-table-column
          label="Member"
          prop="username.crowdUsername"
          width="220"
          sortable="custom"
        >
          <template #default="scope">
            <router-link
              :to="{
                name: 'communityMemberView',
                params: { id: scope.row.id }
              }"
              class="flex items-center text-black"
            >
              <app-avatar
                :entity="scope.row"
                size="sm"
                class="mr-2"
              />
              <span class="font-semibold">{{
                scope.row.username['crowdUsername']
              }}</span>
            </router-link>
          </template>
        </el-table-column>

        <el-table-column
          label="Engagement Level"
          prop="score"
          width="180"
          sortable="custom"
        >
          <template #default="scope">
            <app-community-member-engagement-level
              :member="scope.row"
            />
          </template>
        </el-table-column>

        <el-table-column
          label="Joined At"
          prop="joinedAt"
          sortable="custom"
          width="120"
        >
          <template #default="scope">
            <el-tooltip
              placement="top"
              :content="date(scope.row.joinedAt)"
            >
              <span>
                {{ timeAgo(scope.row.joinedAt) }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column
          :label="
            translate(
              'entities.communityMember.fields.numberActivities'
            )
          "
          prop="activitiesCount"
          sortable="custom"
          width="150"
        >
          <template #default="scope">
            {{ scope.row.activitiesCount }}
          </template>
        </el-table-column>

        <el-table-column
          sortable="custom"
          prop="reach"
          width="120"
        >
          <template #header>
            <span class="inline-flex items-center">
              <span class="inline-flex mr-1">Reach</span>
              <el-tooltip placement="top">
                <template #content>
                  Combined followers on connected social
                  channels<br /><span class="italic"
                    >(Requires Twitter Integration)</span
                  >
                </template>
                <i
                  class="ri-information-line inline-flex items-center mr-2"
                ></i>
              </el-tooltip>
            </span>
          </template>
          <template #default="scope">
            <app-community-member-reach
              :member="scope.row"
            />
          </template>
        </el-table-column>

        <el-table-column
          label="Channels"
          :width="computedChannelsWidth"
        >
          <template #default="scope">
            <app-community-member-channels
              :member="scope.row"
            ></app-community-member-channels>
          </template>
        </el-table-column>

        <el-table-column
          :label="
            translate('entities.communityMember.fields.tag')
          "
        >
          <template #default="scope">
            <app-tag-list
              :member="scope.row"
              @tags-updated="doRefresh"
            />
          </template>
        </el-table-column>

        <el-table-column width="80">
          <template #default="scope">
            <div class="table-actions">
              <app-community-member-dropdown
                :member="scope.row"
              ></app-community-member-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="el-pagination-wrapper px-3">
        <el-pagination
          :current-page="pagination.currentPage || 1"
          :disabled="loading"
          :layout="paginationLayout"
          :total="count"
          :page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100, 200]"
          @current-change="doChangePaginationCurrentPage"
          @size-change="doChangePaginationPageSize"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import CommunityMemberListToolbar from '@/modules/community-member/components/community-member-list-toolbar.vue'
import { CommunityMemberModel } from '@/modules/community-member/community-member-model'
import { mapGetters, mapActions } from 'vuex'
import { CommunityMemberPermissions } from '@/modules/community-member/community-member-permissions'
import { i18n } from '@/i18n'
import CommunityMemberDropdown from './community-member-dropdown'
import CommunityMemberChannels from './community-member-channels'
import TagList from '@/modules/tag/components/tag-list'
import CommunityMemberEngagementLevel from './community-member-engagement-level'
import CommunityMemberReach from './community-member-reach'
import moment from 'moment'
import computedTimeAgo from '@/utils/time-ago'

const { fields } = CommunityMemberModel

export default {
  name: 'AppCommunityMemberListTable',
  components: {
    'app-community-member-list-toolbar':
      CommunityMemberListToolbar,
    'app-community-member-dropdown':
      CommunityMemberDropdown,
    'app-community-member-channels':
      CommunityMemberChannels,
    'app-tag-list': TagList,
    'app-community-member-engagement-level':
      CommunityMemberEngagementLevel,
    'app-community-member-reach': CommunityMemberReach
  },

  computed: {
    ...mapGetters({
      rows: 'communityMember/list/rows',
      selectedRows: 'communityMember/list/selectedRows',
      count: 'communityMember/list/count',
      loading: 'communityMember/list/loading',
      pagination: 'communityMember/list/pagination',
      isMobile: 'layout/isMobile',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      destroyLoading: 'communityMember/destroy/loading',
      paginationLayout: 'layout/paginationLayout'
    }),

    hasPermissionToEdit() {
      return new CommunityMemberPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },

    hasPermissionToDestroy() {
      return new CommunityMemberPermissions(
        this.currentTenant,
        this.currentUser
      ).destroy
    },

    computedChannelsWidth() {
      const maxChannels = this.rows.reduce((acc, item) => {
        acc =
          Object.keys(item.crowdInfo).length > acc
            ? Object.keys(item.crowdInfo).length
            : acc
        return acc
      }, 0)
      return `${85 + (maxChannels - 1) * 30}px`
    },

    fields() {
      return fields
    },

    members() {
      return [...this.rows]
    }
  },

  mounted() {
    this.doMountTable(this.$refs.table)
  },

  methods: {
    ...mapActions({
      doChangeSort: 'communityMember/list/doChangeSort',
      doChangePaginationCurrentPage:
        'communityMember/list/doChangePaginationCurrentPage',
      doChangePaginationPageSize:
        'communityMember/list/doChangePaginationPageSize',
      doMountTable: 'communityMember/list/doMountTable',
      doDestroy: 'communityMember/destroy/doDestroy'
    }),

    doRefresh() {
      this.doChangePaginationCurrentPage()
    },

    presenter(row, fieldName) {
      return CommunityMemberModel.presenter(row, fieldName)
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
    date(timestamp) {
      return moment(timestamp).format('YYYY-MM-DD')
    },
    timeAgo(timestamp) {
      return computedTimeAgo(timestamp)
    }
  }
}
</script>

<style lang="scss">
.community-member-list-table {
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
}
</style>
