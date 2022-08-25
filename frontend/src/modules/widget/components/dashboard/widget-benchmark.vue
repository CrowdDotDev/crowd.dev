<template>
  <app-widget
    :config="config"
    @open-settings-modal="modal = true"
    class="widget-benchmark"
    v-if="widget"
  >
    <div class="empty-placeholder" v-if="hasNoData">
      <div class="text-center">
        <button
          class="btn btn--primary"
          @click="modal = true"
        >
          Set Benchmark Widget
        </button>
        <span class="block mt-4 text-sm text-gray-500">
          Compare your repository with others from GitHub
        </span>
      </div>
    </div>
    <line-chart
      v-else
      :data="computedData"
      :min="null"
      :library="{
        elements: {
          point: {
            radius: 0,
            hoverRadius: 5
          }
        }
      }"
    />
    <el-dialog
      :title="`${config.title} Settings`"
      :visible.sync="modal"
      @close="modal = false"
    >
      <app-benchmark-settings
        :widget="widget"
        :timeframe-options="timeframeOptions"
        @submit="handleSettingsSubmit"
        v-if="config.type === 'benchmark'"
      />
    </el-dialog>
  </app-widget>
</template>

<script>
import Widget from '../widget'
import BenchmarkSettings from './_settings/_benchmark-settings'
import GithubGetStarHistory from '@/utils/github-get-star-history'
import authAxios from '@/shared/axios/auth-axios'
import { mapGetters, mapActions } from 'vuex'
import moment from 'moment'

export default {
  name: 'app-widget-benchmark',
  components: {
    'app-widget': Widget,
    'app-benchmark-settings': BenchmarkSettings
  },
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      widgetFindByType: 'widget/findByType'
    }),
    widget() {
      return this.widgetFindByType('benchmark') || {}
    },
    hasNoData() {
      return (
        !this.widget.settings ||
        !this.widget.settings.repositories
      )
    },
    computedData() {
      return !this.widget.settings
        ? []
        : this.widget.settings.repositories
            .filter((r) => r.active)
            .map((r) => {
              return {
                name: r.label,
                data: Object.values(r.data).map((d) => [
                  d.date,
                  d.value
                ]),
                color: r.color
              }
            })
    },
    config() {
      return {
        settings: true,
        id: this.widget ? this.widget.id : null,
        type: this.widget.type,
        title: 'GitHub Stars Benchmark',
        loading: this.loading,
        start: null,
        end: null
      }
    }
  },
  data() {
    return {
      modal: false,
      loading: true,
      timeframeOptions: [
        {
          label: 'Last week',
          value: 'last_week',
          date: moment()
            .subtract(7, 'days')
            .format('YYYY-MM-DD')
        },
        {
          label: 'Last two weeks',
          value: 'last_two_weeks',
          date: moment()
            .subtract(14, 'days')
            .format('YYYY-MM-DD')
        },
        {
          label: 'Last month',
          value: 'last_month',
          date: moment()
            .subtract(1, 'months')
            .format('YYYY-MM-DD')
        },
        {
          label: 'Last three months',
          value: 'last_three_months',
          date: moment()
            .subtract(3, 'months')
            .format('YYYY-MM-DD')
        }
      ]
    }
  },
  methods: {
    ...mapActions({
      updateWidgetSettings: 'widget/updateSettings'
    }),
    async handleSettingsSubmit(settings) {
      this.modal = false
      await this.refreshData(settings)
      if (this.widget.settings.repositories.length > 0) {
        window.analytics.track('Set Benchmark')
        try {
          await authAxios.post(
            `/tenant/${this.currentTenant.id}/microservices`,
            {
              init: true,
              type: 'github_lookalike'
            }
          )
        } catch (error) {
          console.log(error)
        }
      }
    },
    async refreshData(settings) {
      if (
        settings &&
        settings.last_updated_at !==
          moment().format('YYYY-MM-DD')
      ) {
        this.loading = true
        const repositories = settings.repositories
        const timeframe = settings.timeframe
          ? this.timeframeOptions.find((o) => {
              return settings.timeframe.value === o.value
            })
          : this.timeframeOptions[
              this.timeframeOptions.length - 1
            ]
        for (const repo of repositories.filter(
          (r) => r.active
        )) {
          repo.data = await GithubGetStarHistory(
            repo.githubRepo.full_name,
            this.githubToken,
            timeframe.date
          )
        }
        await this.updateWidgetSettings({
          id: this.widget.id,
          data: {
            settings: {
              repositories,
              last_updated_at: moment().format(
                'YYYY-MM-DD'
              ),
              timeframe: timeframe
            }
          }
        })
      }
      this.loading = false
    }
  },
  async created() {
    await this.refreshData(this.widget.settings)
  }
}
</script>

<style lang="scss">
.widget-benchmark {
  .empty-placeholder {
    @apply flex items-center justify-center flex-grow;
    min-height: 300px;
  }
}
</style>
