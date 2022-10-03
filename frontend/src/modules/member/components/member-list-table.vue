<template>
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
            <div
              v-if="scope.row.organization"
              class="flex-items-center"
            >
              <div class="w-5 h-5">
                <img
                  v-if="scope.row.organization.logo"
                  :src="scope.row.organization.logo"
                  alt=""
                />
              </div>
              <span>{{
                scope.row.organization?.name
              }}</span>
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

        <el-table-column
          label="Identities"
          :width="computedChannelsWidth"
        >
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
            <app-tag-list
              :member="scope.row"
              @tags-updated="doRefresh"
            />
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
        >
          <div class="flex flex-grow"></div>
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import MemberListToolbar from '@/modules/member/components/member-list-toolbar.vue'
import { MemberModel } from '@/modules/member/member-model'
import { mapGetters, mapActions, mapState } from 'vuex'
import { MemberPermissions } from '@/modules/member/member-permissions'
import { i18n } from '@/i18n'
import MemberDropdown from './member-dropdown'
import MemberChannels from './member-channels'
import TagList from '@/modules/tag/components/tag-list'
import MemberEngagementLevel from './member-engagement-level'
import moment from 'moment'
import computedTimeAgo from '@/utils/time-ago'

const { fields } = MemberModel

export default {
  name: 'AppMemberListTable',
  components: {
    'app-member-list-toolbar': MemberListToolbar,
    'app-member-dropdown': MemberDropdown,
    'app-member-channels': MemberChannels,
    'app-tag-list': TagList,
    'app-member-engagement-level': MemberEngagementLevel
  },

  computed: {
    ...mapState({
      rows: (state) => state.member.list.ids,
      loading: (state) => state.member.list.loading,
      count: (state) => state.member.count
    }),
    ...mapGetters({
      selectedRows: 'member/selectedRows',
      pagination: 'member/pagination',
      isMobile: 'layout/isMobile',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      paginationLayout: 'layout/paginationLayout'
    }),

    hasPermissionToEdit() {
      return new MemberPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },

    hasPermissionToDestroy() {
      return new MemberPermissions(
        this.currentTenant,
        this.currentUser
      ).destroy
    },

    computedChannelsWidth() {
      const maxChannels = this.rows?.reduce((acc, item) => {
        acc =
          Object.keys(item.username).length > acc
            ? Object.keys(item.username).length
            : acc
        return acc
      }, 0)
      return `${90 + maxChannels * 32}px`
    },

    fields() {
      return fields
    }
  },

  mounted() {
    this.doMountTable(this.$refs.table)
  },

  methods: {
    ...mapActions({
      doChangeSort: 'member/doChangeSort',
      doChangePaginationCurrentPage:
        'member/doChangePaginationCurrentPage',
      doChangePaginationPageSize:
        'member/doChangePaginationPageSize',
      doMountTable: 'member/doMountTable',
      doDestroy: 'member/doDestroy'
    }),

    doRefresh() {
      this.doChangePaginationCurrentPage()
    },

    presenter(row, fieldName) {
      return MemberModel.presenter(row, fieldName)
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
    },
    handleRowClick(row) {
      this.$router.push({
        name: 'memberView',
        params: { id: row.id }
      })
    }
  }
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

.el-pagination-wrapper .el-pagination {
  @apply flex w-full gap-2;

  .el-pagination__total {
    @apply mr-6 text-gray-500;
  }

  .btn-prev,
  .btn-next {
    &:not([disabled]):hover {
      @apply bg-gray-100;
    }

    &-is-first,
    &-is-last {
      @apply cursor-not-allowed;
    }
  }

  .el-icon svg {
    @apply text-gray-500;
    display: unset;
  }

  button {
    @apply m-0;
  }

  ul.el-pager {
    @apply flex gap-2;

    li.number {
      @apply font-normal text-gray-600 m-0;

      &:not(.is-active):hover {
        @apply bg-gray-100;
      }

      &.is-active {
        @apply bg-brand-500;
      }
    }
  }
}
</style>
