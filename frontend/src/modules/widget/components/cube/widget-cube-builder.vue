<template>
  <form>
    <query-builder
      style="width: 100%"
      :cubejs-api="cubejsApi"
      :initial-viz-state="vizState"
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
        <div>
          <div class="text-base font-semibold mb-4">
            Set up your widget
          </div>
          <div class="flex flex-wrap -mx-3 -my-2">
            <div class="px-3 py-2 w-full lg:w-1/3">
              <label class="block leading-none mb-1"
                >Title</label
              >
              <el-input
                v-model="model.title"
                type="text"
                placeholder="Most active contributors"
              />
            </div>
            <div class="px-3 py-2 w-full lg:w-1/3">
              <MeasureSelect
                :translated-options="translatedOptions"
                :measures="measures"
                :available-measures="availableMeasures"
                :set-measures="setMeasures"
              />
            </div>
            <div class="px-3 py-2 w-full lg:w-1/3">
              <DimensionSelect
                :translated-options="translatedOptions"
                :measures="measures"
                :available-dimensions="availableDimensions"
                :dimensions="dimensions"
                :set-dimensions="setDimensions"
              />
            </div>
            <div class="px-3 py-2 w-full lg:w-1/3">
              <TimeDimensionSelect
                :measures="measures"
                :available-time-dimensions="
                  availableTimeDimensions
                "
                :time-dimensions="timeDimensions"
                @change="setTimeDimensions"
              />
            </div>

            <div class="px-3 py-2 w-full lg:w-1/3">
              <GranularitySelect
                :time-dimensions="timeDimensions"
                :set-time-dimensions="setTimeDimensions"
              />
            </div>

            <div class="px-3 py-2 w-full lg:w-1/3">
              <DateRangeSelect
                :time-dimensions="timeDimensions"
                @change="setTimeDimensions"
              />
            </div>

            <div class="px-3 py-2 w-full lg:w-1/3">
              <label class="block leading-none mb-1"
                >Chart Type</label
              >
              <el-select
                :model-value="chartType"
                :items="chartTypes"
                clearable
                filterable
                @change="updateChartType"
              >
                <el-option
                  v-for="item in chartTypes"
                  :key="item"
                  :value="item"
                  >{{ item }}</el-option
                >
              </el-select>
            </div>
            <div
              class="px-3 py-2 w-full lg:w-1/3 flex items-center"
            >
              <button
                type="button"
                class="inline-flex items-center leading-none mt-5 text-secondary-900 cursor-pointer hover:opacity-80"
                @click="handleAdditionalSettingsClick"
              >
                <i
                  class="mr-1"
                  :class="
                    additionalSettingsVisible
                      ? 'ri-arrow-up-s-line'
                      : 'ri-arrow-down-s-line'
                  "
                ></i>
                {{
                  additionalSettingsVisible
                    ? 'Hide'
                    : 'Show'
                }}
                Additional Settings
              </button>
            </div>
          </div>
          <div
            v-if="additionalSettingsVisible"
            class="additional-settings my-4 flex flex-wrap"
          >
            <Limit
              :limit="Number(limit)"
              :disabled="!isQueryPresent"
              class="px-3 py-2 w-full lg:w-1/2"
              @update="setLimit"
            />
            <Order
              :order-members="orderMembers"
              :disabled="!isQueryPresent"
              class="px-3 py-2 w-full lg:w-1/2"
              @order-change="updateOrder.set"
              @reorder="updateOrder.reorder"
            />
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
        <hr class="my-6" />
        <div class="text-base font-semibold mb-4">
          Widget preview
        </div>
      </template>
      <template
        #default="{
          resultSet,
          isQueryPresent,
          validatedQuery,
          chartType
        }"
      >
        <div v-if="!isQueryPresent" class="">
          Please fill in all the required fields.
        </div>
        <div v-else>
          <app-widget-cube
            :widget="
              buildWidgetPreview({
                chartType,
                query: validatedQuery
              })
            "
            :result-set="resultSet"
          ></app-widget-cube>
        </div>
        <div class="flex items-center justify-end mt-12">
          <el-button
            class="btn btn--primary mr-2"
            @click="
              handleSubmit({
                chartType,
                query: validatedQuery
              })
            "
          >
            <i class="ri-lg ri-check-line mr-1" />
            Save Widget
          </el-button>
          <el-button
            class="btn btn--secondary"
            @click="$emit('close')"
          >
            <i class="ri-lg ri-close-line mr-1" />
            <app-i18n code="common.cancel"></app-i18n>
          </el-button>
        </div>
      </template>
    </query-builder>
  </form>
</template>

<script>
import { QueryBuilder } from '@cubejs-client/vue3'

import WidgetCube from '@/modules/widget/components/cube/widget-cube'
import { mapGetters, mapActions } from 'vuex'
import { i18n } from '@/i18n'

import MeasureSelect from './_query_builder/MeasureSelect'
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
    modelValue: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['close', 'submit'],

  data() {
    const query = this.modelValue.settings
      ? this.modelValue.settings.query
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

    return {
      model: JSON.parse(JSON.stringify(this.modelValue)),
      chartTypes: [
        'line',
        'area',
        'bar',
        'pie',
        'table',
        'number'
      ],
      vizState: {
        query,
        chartType: this.modelValue.settings
          ? this.modelValue.settings.chartType
          : 'line'
      },
      additionalSettingsVisible: false
    }
  },

  computed: {
    ...mapGetters({
      cubejsApi: 'widget/cubejsApi'
    })
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
    handleSubmit(query) {
      const widgetEl =
        this.$el.querySelector('.widget-cube')
      const widget = {
        id: this.modelValue.id
          ? this.modelValue.id
          : undefined,
        title: this.model.title,
        type: this.modelValue.type,
        reportId: this.modelValue.reportId,
        settings: Object.assign(
          {},
          this.modelValue.settings,
          query
        )
      }

      if (!widget.settings.layout) {
        widget.settings.layout = {}
      }

      // Compute widget's height based on position of the grid
      const widgetHeight =
        widgetEl.offsetHeight < 100
          ? widgetEl.offsetHeight / 18
          : (widgetEl.offsetHeight - 40) / 20
      widget.settings.layout.h = Math.ceil(widgetHeight)
      this.$emit('submit', widget)
      this.$emit('close')
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
    }
  }
}
</script>

<style lang="scss">
.additional-settings {
  @apply p-2;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f0f2f5;
}
</style>
