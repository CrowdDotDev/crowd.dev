<template>
  <app-widget v-if="widget" :config="config">
    <div class="widget-latest-activities">
      <el-table
        ref="table"
        :border="true"
        :data="rows"
        row-key="id"
        :show-header="false"
      >
        <el-table-column>
          <template #default="scope">
            <app-activity-header
              :activity="scope.row"
              size="xs"
            />
            <app-activity-dropdown
              :activity="scope.row"
              @activity-destroyed="handleActivityDestroyed"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </app-widget>
</template>

<script>
import Widget from '../widget'
import { ActivityService } from '@/modules/activity/activity-service'
import ActivityDropdown from '@/modules/activity/components/activity-dropdown'
import ActivityHeader from '@/modules/activity/components/activity-header'
import { mapGetters } from 'vuex'

export default {
  name: 'AppWidgetLatestActivities',
  components: {
    'app-widget': Widget,
    'app-activity-header': ActivityHeader,
    'app-activity-dropdown': ActivityDropdown
  },
  data() {
    return {
      rows: [],
      loading: false
    }
  },
  computed: {
    ...mapGetters({
      widgetFindByType: 'widget/findByType'
    }),
    widget() {
      return this.widgetFindByType('latest-activities')
    },
    config() {
      return {
        id: this.widget ? this.widget.id : null,
        type: this.widget.type,
        title: 'Latest Activities',
        rows: this.rows,
        loading: this.loading,
        link: { name: 'activity' },
        linkLabel: 'View all'
      }
    }
  },
  async created() {
    this.loading = true
    const response = await ActivityService.list(
      null,
      'timestamp_DESC',
      15,
      null
    )
    this.rows = response.rows
    this.loading = false
  },
  methods: {
    handleActivityDestroyed(activityId) {
      const index = this.rows.findIndex(
        (a) => a.id === activityId
      )

      this.rows.splice(index, 1)
    }
  }
}
</script>

<style lang="scss">
.widget-latest-activities {
  @apply h-72 flex justify-center relative -mx-6 -mb-4;
  .el-table {
    @apply mt-0 rounded-b;
  }
  .el-table__row {
    @apply relative;
    .el-dropdown {
      @apply mt-0 top-0 bottom-0 mr-6 flex items-center;
    }
  }
  .el-table__body-wrapper {
    @apply max-h-72 overflow-auto;
  }
}
</style>
