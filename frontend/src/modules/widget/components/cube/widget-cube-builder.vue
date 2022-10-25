<template>
  <el-drawer
    v-model="visible"
    :close-on-click-modal="false"
    :show-close="false"
    size="600px"
    custom-class="widget-cube-builder"
  >
    <template #header>
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-medium text-gray-1000">
          Edit widget
        </h2>

        <button
          type="button"
          class="btn btn--transparent btn--md w-10"
          @click="visible = false"
        >
          <i
            class="ri-xl w-4 h-4 ri-close-line flex items-center justify-center"
          ></i>
        </button>
      </div>
    </template>
    <query-builder
      style="width: 100%"
      :cubejs-api="cubejsApi"
      :query="initialQuery"
      :initial-chart-type="initialChartType"
    >
      <template
        #builder="{
          chartType,
          updateChartType,
          measures,
          setMeasures,
          availableMeasures,
          dimensions,
          setDimensions,
          availableDimensions,
          timeDimensions,
          setTimeDimensions,
          availableTimeDimensions,
          filters,
          setFilters,
          limit,
          setLimit,
          orderMembers,
          updateOrder,
          isQueryPresent
        }"
      >
        <SyncModel
          v-model:chart-type="model.settings.chartType"
          :chart-type="chartType"
        />
        <div class="overflow-auto flex-grow flex flex-col">
          <div class="p-6">
            <div class="w-full mb-6">
              <label
                class="block text-xs leading-none font-semibold mb-1"
                >Name
                <span class="text-brand-500 ml-0.5"
                  >*</span
                ></label
              >
              <el-input
                v-model="model.title"
                type="text"
                placeholder="Most active contributors"
              />
            </div>

            <div class="w-full mb-6">
              <ChartType
                v-model="model.settings.chartType"
                :chart-type="chartType"
                :update-chart-type="updateChartType"
              ></ChartType>
            </div>
            <div class="w-full mb-6">
              <MeasureSelect
                :translated-options="translatedOptions"
                :measures="measures"
                :available-measures="availableMeasures"
                :set-measures="setMeasures"
              />
            </div>

            <div class="w-full mb-6">
              <DateRangeSelect
                :time-dimensions="timeDimensions"
                @change="setTimeDimensions"
              />
            </div>

            <div class="w-full mb-6">
              <TimeDimensionSelect
                :measures="measures"
                :available-time-dimensions="
                  availableTimeDimensions
                "
                :time-dimensions="timeDimensions"
                @change="setTimeDimensions"
              />
            </div>

            <div class="w-full mb-6">
              <DimensionSelect
                :translated-options="translatedOptions"
                :measures="measures"
                :available-dimensions="availableDimensions"
                :dimensions="dimensions"
                :set-dimensions="setDimensions"
              />
            </div>

            <div class="w-full mb-6">
              <GranularitySelect
                :time-dimensions="timeDimensions"
                :set-time-dimensions="setTimeDimensions"
              />
            </div>

            <div class="additional-settings">
              <button
                type="button"
                class="inline-flex items-center leading-none mt-2 text-xs text-gray-600 font cursor-pointer hover:text-gray-900"
                @click="handleAdditionalSettingsClick"
              >
                <i
                  class="mr-1 text-base"
                  :class="
                    additionalSettingsVisible
                      ? 'ri-arrow-up-s-line'
                      : 'ri-arrow-down-s-line'
                  "
                ></i>
                Additional settings
              </button>
              <div
                v-if="additionalSettingsVisible"
                class="my-4"
              >
                <Limit
                  :limit="Number(limit)"
                  :disabled="!isQueryPresent"
                  class="px-3 py-2 w-full"
                  @update="setLimit"
                />
                <Order
                  :order-members="orderMembers"
                  :disabled="!isQueryPresent"
                  class="px-3 py-2 w-full"
                  @order-change="updateOrder.set"
                  @reorder="updateOrder.reorder"
                />
              </div>
            </div>
            <hr class="mt-6 mb-4" />
            <div>
              <FilterComponent
                :measures="measures"
                :dimensions="dimensions"
                :filters="filters"
                :set-filters="setFilters"
                :available-dimensions="
                  translatedOptions(availableDimensions)
                "
              ></FilterComponent>
            </div>
          </div>
        </div>
      </template>
      <template #default="{ resultSet, validatedQuery }">
        <SyncModel
          v-model:model-query="model.settings.query"
          :query="validatedQuery"
        ></SyncModel>
        <div class="border-t border-gray-200">
          <div
            class="preview-collapse"
            @click="handlePreviewChange"
          >
            <i
              :class="
                previewExpanded
                  ? 'ri-arrow-down-s-line'
                  : 'ri-arrow-up-s-line'
              "
              class="text-base mr-1"
            ></i>
            Preview
          </div>
          <div
            v-show="previewExpanded"
            class="preview px-4"
          >
            <app-widget-cube
              v-if="
                model.settings.chartType &&
                model.settings.query
              "
              :widget="
                buildWidgetPreview({
                  chartType: model.settings.chartType,
                  query: model.settings.query
                })
              "
              :result-set="resultSet"
            ></app-widget-cube>
          </div>
        </div>
      </template>
    </query-builder>
    <template #footer>
      <div class="relative">
        <div class="flex items-center justify-end">
          <el-button
            class="btn btn--bordered btn--md mr-3"
            @click="visible = false"
          >
            <app-i18n code="common.cancel"></app-i18n>
          </el-button>
          <el-button
            class="btn btn--primary btn--md"
            @click="handleSubmit"
          >
            {{ widget.id ? 'Update' : 'Create' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script>
import { QueryBuilder } from '@cubejs-client/vue3'

import WidgetCube from '@/modules/widget/components/cube/widget-cube'
import { mapGetters, mapActions } from 'vuex'
import { i18n } from '@/i18n'

import SyncModel from './_query_builder/SyncModel'
import MeasureSelect from './_query_builder/MeasureSelect'
import ChartType from './_query_builder/ChartType'
import DimensionSelect from './_query_builder/DimensionSelect'
import GranularitySelect from './_query_builder/GranularitySelect'
import TimeDimensionSelect from './_query_builder/TimeDimensionSelect'
import DateRangeSelect from './_query_builder/DateRangeSelect'

import Order from './_query_builder/Order'
import Limit from './_query_builder/Limit'

import FilterComponent from '@/modules/widget/components/cube/_query_builder/FilterComponent.vue'

export default {
  name: 'WidgetCubeBuilder',

  components: {
    QueryBuilder,
    SyncModel,
    ChartType,
    MeasureSelect,
    DimensionSelect,
    TimeDimensionSelect,
    DateRangeSelect,
    GranularitySelect,
    Order,
    Limit,
    FilterComponent,
    'app-widget-cube': WidgetCube
  },

  props: {
    drawer: {
      type: Boolean,
      default: false
    },
    widget: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['update:widget', 'update:drawer', 'submit'],

  data() {
    const initialQuery = this.widget.settings?.query
      ? JSON.parse(
          JSON.stringify(this.widget.settings.query)
        )
      : {
          measures: ['Activities.count'],
          timeDimensions: [
            {
              dimension: 'Activities.date',
              granularity: 'week',
              dateRange: 'Last 30 days'
            }
          ]
        }

    const initialCharType =
      this.widget.settings?.chartType || 'line'
    return {
      model: {
        ...this.widget,
        settings: {
          chartType: initialCharType,
          query: initialQuery
        }
      },
      initialQuery: initialQuery,
      initialChartType: initialCharType,
      additionalSettingsVisible: false,
      previewExpanded: false
    }
  },

  computed: {
    ...mapGetters({
      cubejsApi: 'widget/cubejsApi'
    }),
    visible: {
      get() {
        return this.drawer
      },
      set(value) {
        this.$emit('update:drawer', value)
      }
    }
  },

  async created() {
    if (this.cubejsApi === null) {
      await this.getCubeToken()
    }
  },

  methods: {
    ...mapActions({
      getCubeToken: 'widget/getCubeToken'
    }),
    handleSubmit() {
      const widgetEl = document.querySelector(
        '.widget-cube-builder .widget-cube'
      )
      const objToSubmit = {
        id: this.widget.id ? this.widget.id : undefined,
        title: this.model.title,
        type: this.widget.type,
        reportId: this.widget.reportId,
        settings: JSON.parse(
          JSON.stringify(this.model.settings)
        )
      }

      if (!objToSubmit.settings.layout) {
        objToSubmit.settings.layout = {}
      }

      // Compute widget's height based on position of the grid
      const widgetHeight =
        widgetEl.offsetHeight < 100
          ? widgetEl.offsetHeight / 18
          : (widgetEl.offsetHeight - 40) / 20
      objToSubmit.settings.layout.h =
        Math.ceil(widgetHeight)
      this.$emit('submit', objToSubmit)
      this.visible = false
    },
    buildWidgetPreview(settings) {
      return {
        title: this.model.title,
        settings
      }
    },
    translatedOptions(list) {
      return list.map((i) => {
        return {
          ...i,
          value: i.name,
          label: i18n(`widget.cubejs.${i.name}`)
        }
      })
    },
    handleAdditionalSettingsClick() {
      this.additionalSettingsVisible =
        !this.additionalSettingsVisible
    },
    handlePreviewChange() {
      this.previewExpanded = !this.previewExpanded
    }
  }
}
</script>

<style lang="scss">
.additional-settings {
  @apply p-2 border border-gray-200;
  border-radius: 4px;
}

.widget-cube-builder {
  .el-drawer__body {
    @apply p-0;
    & > div {
      @apply h-full flex flex-1 flex-col;
    }

    .preview-collapse {
      @apply px-6 uppercase text-gray-600 text-2xs cursor-pointer flex items-center h-12;
      &:hover {
        @apply text-gray-900;
      }
    }
    .preview {
      max-height: 40vh;
    }
    .el-collapse-item__content {
      @apply pb-0;
    }
    .widget.panel {
      @apply mb-0 shadow-none;
    }
  }
}
</style>
