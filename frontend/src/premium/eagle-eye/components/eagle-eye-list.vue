<template>
  <div class="pt-2 pb-6">
    <div class="eagle-eye-list">
      <div v-if="count > 0">
        <transition-group name="fade" mode="out-in">
          <app-eagle-eye-list-item
            v-for="record in rows"
            :key="record.id"
            :record="record"
          />
        </transition-group>
      </div>
      <div
        v-else
        class="flex items-center justify-center flex-col text-gray-600 pt-4"
      >
        <i class="ri-3x ri-folder-3-line"></i>
        <span class="text-sm"
          >{{ computedEmptyStateCopy }}
        </span>
      </div>
      <div
        v-if="count > 0 && count > limit"
        class="el-pagination-wrapper"
      >
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
import AppEagleEyeListItem from './eagle-eye-list-item'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'AppEagleEyeList',
  components: {
    AppEagleEyeListItem
  },
  computed: {
    ...mapGetters({
      rows: 'eagleEye/activeTabRows',
      loading: 'eagleEye/loading',
      count: 'eagleEye/count',
      filter: 'eagleEye/filter',
      limit: 'eagleEye/limit',
      activeTab: 'eagleEye/activeTab',
      pagination: 'eagleEye/pagination',
      paginationLayout: 'layout/paginationLayout'
    }),
    computedEmptyStateCopy() {
      if (
        this.filter.keywords &&
        this.filter.keywords.length > 0
      ) {
        return 'No posts found based on your search criteria'
      } else if (this.activeTab === 'rejected') {
        return 'No excluded posts'
      } else if (this.activeTab === 'engaged') {
        return 'No engaged posts'
      } else {
        return 'No posts found'
      }
    }
  },
  methods: {
    ...mapActions({
      doChangePaginationCurrentPage:
        'eagleEye/doChangePaginationCurrentPage',
      doChangePaginationPageSize:
        'eagleEye/doChangePaginationPageSize'
    })
  }
}
</script>
