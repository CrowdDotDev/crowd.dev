<template>
  <div class="dashboard-number-widgets">
    <el-row
      :gutter="16"
      class="mt-4 mb-2 justify-between items-center"
    >
      <el-col :lg="12" :md="12" :sm="24">
        <div class="flex items-end">
          <div class="font-light text-xl leading-none">
            Your community
          </div>
          <div
            class="flex items-center text-sm ml-4 text-gray-500"
          >
            <i class="ri-information-line mr-1"></i>
            <span class="block font-light italic"
              >Metrics are recomputed every hour</span
            >
          </div>
        </div>
      </el-col>
      <el-col :lg="12" :md="12" :sm="24">
        <div class="flex justify-end items-center">
          <el-select v-model="date" placeholder="Select">
            <el-option
              v-for="(item, index) in dateOptions"
              :key="index"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
      </el-col>
    </el-row>
    <el-row type="flex" :gutter="16">
      <el-col :lg="6" :md="12" :sm="24">
        <app-widget-cube-renderer
          :widget="membersWidget"
          :dashboard="true"
          :show-subtitle="false"
        ></app-widget-cube-renderer>
      </el-col>
      <el-col :lg="6" :md="12" :sm="24">
        <app-widget-cube-renderer
          :widget="inactiveMembersWidget"
          :dashboard="true"
          :show-subtitle="false"
        ></app-widget-cube-renderer>
      </el-col>
      <el-col :lg="6" :md="12" :sm="24">
        <app-widget-cube-renderer
          :widget="activitiesWidget"
          :dashboard="true"
          :show-subtitle="false"
        ></app-widget-cube-renderer>
      </el-col>
      <el-col :lg="6" :md="12" :sm="24">
        <app-widget-cube-renderer
          :widget="timeToInteractionWidget"
          :dashboard="true"
          :show-subtitle="false"
        ></app-widget-cube-renderer>
      </el-col>
    </el-row>
    <el-row type="flex" :gutter="16">
      <el-col :lg="12" :md="12" :sm="24">
        <app-widget-graph-members :date="dateForCube" />
      </el-col>
      <el-col :lg="12" :md="12" :sm="24">
        <app-widget-graph-activities :date="dateForCube" />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import moment from 'moment'
import { mapGetters } from 'vuex'
import WidgetGraphActivities from '@/modules/widget/components/dashboard/widget-graph-activities'
import WidgetGraphMembers from '@/modules/widget/components/dashboard/widget-graph-members'
import WidgetCubeRenderer from '@/modules/widget/components/cube/widget-cube-renderer'

export default {
  name: 'DashboardNumberWidgets',
  components: {
    'app-widget-graph-members': WidgetGraphMembers,
    'app-widget-graph-activities': WidgetGraphActivities,
    'app-widget-cube-renderer': WidgetCubeRenderer
  },

  data() {
    return {
      date: moment()
        .subtract(7, 'days')
        .format('YYYY-MM-DD'),
      dateOptions: [
        {
          label: 'Last 7 days',
          value: moment()
            .subtract(7, 'days')
            .format('YYYY-MM-DD')
        },
        {
          label: 'Last 14 days',
          value: moment()
            .subtract(14, 'days')
            .format('YYYY-MM-DD')
        },
        {
          label: 'Last 30 days',
          value: moment()
            .subtract(1, 'months')
            .format('YYYY-MM-DD')
        },
        {
          label: 'Last 90 days',
          value: moment()
            .subtract(3, 'months')
            .format('YYYY-MM-DD')
        }
      ]
    }
  },

  computed: {
    ...mapGetters({
      widgetFindByType: 'widget/findByType',
      widgetsArray: 'widget/array'
    }),

    dateRange() {
      return [this.date, moment()]
    },

    dateForCube() {
      return [this.date, moment().format('YYYY-MM-DD')]
    },

    inactiveMembersWidget() {
      return {
        title: 'Active Members',
        settings: {
          chartType: 'number',
          unit: 'members',
          query: {
            measures: ['Members.count'],
            dimensions: [],
            timeDimensions: [
              {
                dimension: 'Activities.date',
                granularity: undefined,
                dateRange: this.dateForCube
              }
            ],
            limit: 10000,
            order: {
              'Members.joinedAt': 'asc'
            }
          }
        },
        unit: 'members'
      }
    },

    membersWidget() {
      return {
        title: 'New Members',
        settings: {
          chartType: 'number',
          unit: 'members',
          query: {
            measures: ['Members.count'],
            timeDimensions: [
              {
                dimension: 'Members.joinedAt',
                granularity: undefined,
                dateRange: this.dateForCube
              }
            ],
            limit: 10000,
            order: {
              'Members.joinedAt': 'asc'
            }
          }
        },
        unit: 'members'
      }
    },

    timeToInteractionWidget() {
      return {
        title: 'Avg Time to First Interaction',
        settings: {
          chartType: 'number',
          query: {
            measures: [
              'Members.averageTimeToFirstInteraction'
            ],
            timeDimensions: [
              {
                dimension: 'Members.joinedAt',
                dateRange: this.dateForCube
              }
            ],
            order: []
          }
        },
        unit: 'days',
        suffix: 'd'
      }
    },

    activitiesWidget() {
      return {
        title: 'New Activities',
        settings: {
          chartType: 'number',
          unit: 'activities',
          query: {
            measures: ['Activities.count'],
            timeDimensions: [
              {
                dimension: 'Activities.date',
                granularity: undefined,
                dateRange: this.dateForCube
              }
            ],
            limit: 10000,
            order: {
              'Activities.date': 'asc'
            }
          }
        },
        unit: 'activities'
      }
    }
  },
  methods: {
    formattedDate(date) {
      return moment(date).format('YYYY-MM-DD')
    }
  }
}
</script>

<style lang="scss">
.dashboard {
  .el-date-editor.el-range-editor.el-input__inner.el-date-editor--daterange {
    @apply bg-transparent border-none cursor-pointer inline-flex justify-end p-0;

    .el-range-input,
    .el-input__icon.el-range__icon.el-icon-date,
    .el-input__icon.el-range__close-icon {
      @apply hidden;
    }
  }
}
</style>
