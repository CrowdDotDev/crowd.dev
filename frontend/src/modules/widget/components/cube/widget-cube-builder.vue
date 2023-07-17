<template>
  <app-drawer
    v-model="visible"
    title="Edit widget"
    size="600px"
    custom-class="widget-cube-builder"
  >
    <template #content>
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
            isQueryPresent,
          }"
        >
          <SyncModel
            v-model:chart-type="model.settings.chartType"
            :chart-type="chartType"
          />
          <div
            class="overflow-auto flex-grow flex flex-col"
          >
            <div class="p-6">
              <div class="w-full mb-6">
                <label
                  for="formTitle"
                  class="block text-xs leading-none font-semibold mb-1"
                >Name
                  <span class="text-brand-500 ml-0.5">*</span></label>
                <el-input
                  id="formTitle"
                  v-model="model.title"
                  type="text"
                  placeholder="Most active contributors"
                />
              </div>

              <div class="w-full mb-6">
                <ChartType
                  v-model="model.settings.chartType"
                  :update-chart-type="updateChartType"
                />
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
                  :available-dimensions="
                    availableDimensions
                  "
                  :dimensions="dimensions"
                  :set-dimensions="setDimensions"
                />
              </div>

              <div
                v-if="
                  model.settings.chartType === 'area'
                    || model.settings.chartType === 'line'
                    || model.settings.chartType === 'bar'
                    || model.settings.chartType === 'table'
                "
                class="w-full mb-6"
              >
                <GranularitySelect
                  :time-dimensions="timeDimensions"
                  :set-time-dimensions="setTimeDimensions"
                />
              </div>

              <div
                v-if="model.settings.chartType === 'table'"
                class="additional-settings"
              >
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
                  />
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
                />
              </div>
            </div>
          </div>
        </template>
        <template #default="{ resultSet, validatedQuery }">
          <SyncModel
            v-model:model-query="model.settings.query"
            :query="validatedQuery"
          />
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
              />
              Preview
            </div>
            <div
              v-show="previewExpanded"
              class="preview px-4"
            >
              <app-widget-cube
                v-if="
                  model.settings.chartType
                    && model.settings.query
                "
                :widget="
                  mapWidget(
                    buildWidgetPreview({
                      chartType: model.settings.chartType,
                      query: model.settings.query,
                    }),
                    resultSet,
                  )
                "
                :result-set="resultSet"
                :chart-options="
                  chartOptions(
                    buildWidgetPreview({
                      chartType: model.settings.chartType,
                      query: model.settings.query,
                    }),
                    resultSet,
                  )
                "
              />
            </div>
          </div>
        </template>
      </query-builder>
    </template>
    <template #footer>
      <div class="relative">
        <div class="flex items-center justify-end">
          <el-button
            class="btn btn--bordered btn--md mr-3"
            @click="visible = false"
          >
            <app-i18n code="common.cancel" />
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
  </app-drawer>
</template>

<script>
import { QueryBuilder } from '@cubejs-client/vue3';

import { mapGetters, mapActions } from 'vuex';
import { i18n } from '@/i18n';
import FilterComponent from '@/modules/widget/components/cube/_query_builder/FilterComponent.vue';
import {
  chartOptions,
  mapWidget,
} from '@/modules/report/report-charts';
import WidgetCube from '@/modules/widget/components/cube/widget-cube.vue';

import SyncModel from './_query_builder/SyncModel.vue';
import MeasureSelect from './_query_builder/MeasureSelect.vue';
import ChartType from './_query_builder/ChartType.vue';
import DimensionSelect from './_query_builder/DimensionSelect.vue';
import GranularitySelect from './_query_builder/GranularitySelect.vue';
import TimeDimensionSelect from './_query_builder/TimeDimensionSelect.vue';
import DateRangeSelect from './_query_builder/DateRangeSelect.vue';

import Order from './_query_builder/Order.vue';
import Limit from './_query_builder/Limit.vue';

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
    'app-widget-cube': WidgetCube,
  },

  props: {
    drawer: {
      type: Boolean,
      default: false,
    },
    widget: {
      type: Object,
      default: () => {},
    },
  },
  emits: ['update:widget', 'update:drawer', 'submit'],

  data() {
    const initialQuery = this.widget.settings?.query
      ? JSON.parse(
        JSON.stringify(this.widget.settings.query),
      )
      : {
        measures: ['Activities.count'],
        timeDimensions: [
          {
            dimension: 'Activities.date',
            granularity: 'week',
            dateRange: 'Last 30 days',
          },
        ],
      };

    const initialCharType = this.widget.settings?.chartType || 'line';

    return {
      mapWidget,
      chartOptions,
      model: {
        ...this.widget,
        settings: {
          chartType: initialCharType,
          query: initialQuery,
        },
      },
      initialQuery,
      initialChartType: initialCharType,
      additionalSettingsVisible: false,
      previewExpanded: false,
    };
  },

  computed: {
    ...mapGetters({
      cubejsApi: 'widget/cubejsApi',
    }),
    visible: {
      get() {
        return this.drawer;
      },
      set(value) {
        this.$emit('update:drawer', value);
      },
    },
  },

  async created() {
    if (this.cubejsApi === null) {
      await this.getCubeToken();
    }
  },

  methods: {
    ...mapActions({
      getCubeToken: 'widget/getCubeToken',
    }),
    handleSubmit() {
      const objToSubmit = {
        id: this.widget.id ? this.widget.id : undefined,
        title: this.model.title,
        type: this.widget.type,
        reportId: this.widget.reportId,
        settings: {
          ...this.widget.settings,
          ...JSON.parse(JSON.stringify(this.model.settings)),
        },
      };
      this.$emit('submit', objToSubmit);
      this.visible = false;
    },
    buildWidgetPreview(settings) {
      return {
        title: this.model.title,
        settings,
      };
    },
    translatedOptions(list, fallback) {
      return list.map((i) => ({
        ...i,
        value: i.name,
        label: i.name ? i18n(`widget.cubejs.${i.name}`) : fallback || '',
      }));
    },
    handleAdditionalSettingsClick() {
      this.additionalSettingsVisible = !this.additionalSettingsVisible;
    },
    handlePreviewChange() {
      this.previewExpanded = !this.previewExpanded;
    },
  },
};
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
