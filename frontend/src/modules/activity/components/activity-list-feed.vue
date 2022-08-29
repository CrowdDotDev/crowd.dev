<template>
  <div>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    ></div>
    <div v-else>
      <activity-list-feed-item
        v-for="activity in rows"
        :key="activity.id"
        :activity="activity"
      ></activity-list-feed-item>
      <div class="el-pagination-wrapper">
        <el-pagination
          :current-page="pagination.currentPage || 1"
          :disabled="loading"
          :layout="paginationLayout"
          :total="count"
          :page-sizes="[20, 50, 100, 200]"
          @current-change="doChangePaginationCurrentPage"
          @size-change="doChangePaginationPageSize"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import { ActivityModel } from '@/modules/activity/activity-model'
import { mapGetters, mapActions } from 'vuex'
import { ActivityPermissions } from '@/modules/activity/activity-permissions'
import { i18n } from '@/i18n'

import ActivityListFeedItem from '@/modules/activity/components/activity-list-feed-item'

const { fields } = ActivityModel

export default {
  name: 'AppActivityListFeed',

  components: {
    ActivityListFeedItem
  },

  computed: {
    ...mapGetters({
      rows: 'activity/list/rows',
      count: 'activity/list/count',
      loading: 'activity/list/loading',
      pagination: 'activity/list/pagination',
      isMobile: 'layout/isMobile',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      paginationLayout: 'layout/paginationLayout'
    }),

    hasPermissionToEdit() {
      return new ActivityPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },

    hasPermissionToDestroy() {
      return new ActivityPermissions(
        this.currentTenant,
        this.currentUser
      ).destroy
    },

    fields() {
      return fields
    }
  },

  methods: {
    ...mapActions({
      doChangeSort: 'activity/list/doChangeSort',
      doChangePaginationCurrentPage:
        'activity/list/doChangePaginationCurrentPage',
      doChangePaginationPageSize:
        'activity/list/doChangePaginationPageSize',
      doDestroy: 'activity/destroy/doDestroy'
    }),

    presenter(row, fieldName) {
      return ActivityModel.presenter(row, fieldName)
    },

    async doDestroyWithConfirm(id) {
      try {
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

        return this.doDestroy(id)
      } catch (error) {
        // no
      }
    }
  }
}
</script>

<style></style>
