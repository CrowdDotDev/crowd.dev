<template>
  <div ref="widget" class="widget-cube">
    <app-widget-table
      v-if="chartType === 'table'"
      :show="show"
      :config="{
        title: widget.title,
        subtitle: showSubtitle ? subtitle : null,
        settings: editable ? {} : undefined,
        type: 'cubejs',
        loading: loading,
      }"
      :editable="editable"
      :data="data"
      @trigger-duplicate-widget="handleDuplicate"
      @trigger-edit-widget="handleEdit"
      @trigger-delete-widget="handleDelete"
    />
    <app-widget-number
      v-else-if="chartType === 'number'"
      :show="show"
      :config="{
        title: widget.title,
        subtitle: showSubtitle ? subtitle : null,
        settings: editable ? {} : undefined,
        type: 'cubejs',
        data: data,
        loading: loading,
        suffix: widget.suffix,
        unit: widget.unit,
        measures: query ? query.measures : [],
      }"
      :editable="editable"
      :dashboard="dashboard"
      @trigger-duplicate-widget="handleDuplicate"
      @trigger-edit-widget="handleEdit"
      @trigger-delete-widget="handleDelete"
    />
    <div v-else>
      <app-widget
        v-if="!widget.chartOnly"
        :show="show"
        :config="{
          title: widget.title,
          subtitle: showSubtitle ? subtitle : null,
          settings: editable ? {} : undefined,
          loading: loading,
        }"
        :editable="editable"
        @trigger-duplicate-widget="handleDuplicate"
        @trigger-edit-widget="handleEdit"
        @trigger-delete-widget="handleDelete"
      >
        <div
          class="cube-widget-chart"
          :class="componentType"
        >
          <component
            :is="componentType"
            ref="chart"
            :data="data"
            v-bind="{ ...chartOptions, dataset }"
          />
        </div>
      </app-widget>
      <div
        v-else
        class="cube-widget-chart"
        :class="componentType"
      >
        <component
          :is="componentType"
          ref="chart"
          :data="data"
          v-bind="{ ...chartOptions, dataset }"
        />
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import { i18n } from '@/i18n';
import Widget from '@/modules/widget/components/widget.vue';
import WidgetTable from '../widget-table.vue';
import WidgetNumber from '../widget-number.vue';

export default {
  name: 'WidgetCube',

  components: {
    'app-widget-table': WidgetTable,
    'app-widget-number': WidgetNumber,
    'app-widget': Widget,
  },
  props: {
    show: {
      type: Boolean,
      default: true,
    },
    widget: {
      type: Object,
      required: true,
    },
    resultSet: {
      type: null,
      required: true,
    },
    showSubtitle: {
      type: Boolean,
      default: true,
    },
    dashboard: {
      type: Boolean,
      default: false,
    },
    editable: {
      type: Boolean,
      default: false,
    },
    chartOptions: {
      type: Object,
      default: () => {},
    },
  },
  emits: ['duplicate', 'edit', 'delete'],
  data() {
    return {
      dataset: null,
    };
  },
  computed: {
    loading() {
      return (
        !this.resultSet
        || this.resultSet.loadResponse === undefined
      );
    },
    chartType() {
      return this.widget.settings.chartType || 'line';
    },
    subtitle() {
      const granularity = this.widget.settings.query.timeDimensions?.length > 0
        ? this.widget.settings.query.timeDimensions[0]
          .granularity
        : null;
      const dateRange = this.widget.settings.query.timeDimensions?.length > 0
        ? this.widget.settings.query.timeDimensions[0]
          .dateRange || 'All time'
        : null;

      if (this.chartType === 'number') {
        return dateRange;
      } if (granularity && dateRange) {
        return `${dateRange}, per ${granularity.toLowerCase()}`;
      } if (dateRange) {
        return dateRange;
      }
      return null;
    },
    componentType() {
      if (['table', 'number'].includes(this.chartType)) {
        return this.chartType;
      }
      return `${
        this.chartType === 'bar'
          ? 'column'
          : this.chartType
      }-chart`;
    },

    query() {
      if (this.resultSet) {
        return this.resultSet.loadResponse
          ? this.resultSet.loadResponse.pivotQuery
          : null;
      }
      return null;
    },

    data() {
      if (this.loading) {
        return ['number'].includes(this.chartType) ? {} : [];
      }

      let data;

      if (['line', 'area'].includes(this.chartType)) {
        data = this.series(this.resultSet);
      }

      if (this.chartType === 'pie') {
        data = this.pairs(this.resultSet);
      }

      if (this.chartType === 'bar') {
        data = this.seriesPairs(this.resultSet);
      }

      if (this.chartType === 'table') {
        data = this.tableData(this.resultSet);
      }

      if (this.chartType === 'number') {
        // if widget type is 'number' we pick the last value of the array
        data = {
          value:
            this.resultSet.series().length > 0
              ? this.resultSet.series()[0].series[
                this.resultSet.series()[0].series.length
                    - 1
              ].value
              : 0,
        };
      }

      if (
        // Sort X axis of engagement level based charts
        this.query.dimensions.length > 0
        && this.query.dimensions[0].includes('score')
        && (!this.query.timeDimensions.length
          || (this.query.timeDimensions.length > 0
            && !this.query.timeDimensions[0].granularity))
      ) {
        data = this.sortEngagementLevelAxisX(data);
      }

      return data;
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.paintDataSet();
    });
  },
  updated() {
    this.paintDataSet();
  },
  methods: {
    paintDataSet() {
      if (!this.chartOptions.computeDataset) {
        this.dataset = undefined;
      }
      if (
        !this.dataset
        && this.$refs
        && this.$refs.widget
      ) {
        const canvas = this.$refs.widget.querySelector(
          '.cube-widget-chart canvas',
        );
        if (
          canvas
          && this.chartOptions
          && this.chartOptions.computeDataset
        ) {
          this.dataset = this.chartOptions.computeDataset(canvas);
        }
      }
    },
    series(resultSet) {
      // For line & area charts
      const seriesNames = resultSet.seriesNames();
      const pivot = resultSet.chartPivot();
      const series = [];
      if (seriesNames.length > 0) {
        seriesNames.forEach((e) => {
          const data = pivot.map((p) => [p.x, p[e.key]]);
          const { cube, dimension } = this.deconstructLabel(
            e.key,
          );

          const name = dimension && dimension !== 'unknown'
            ? dimension
            : i18n(`widget.cubejs.cubes.${cube}`);
          series.push({ name, data });
        });
      } else {
        let name;
        if (this.query.measures.length > 0) {
          const key = this.query.measures[0];
          const { cube, dimension } = this.deconstructLabel(key);
          name = dimension && dimension !== 'unknown'
            ? dimension
            : i18n(`widget.cubejs.cubes.${cube}`);
        }
        const data = pivot.map((p) => [p.x, 0]);
        series.push({
          data,
          name,
        });
      }

      return series;
    },
    pairs(resultSet) {
      // For pie charts
      return resultSet.series()[0]
        ? resultSet.series()[0].series.map((item) => {
          let { x } = item;
          const formattedDate = moment(x).format(
            'MMM DD',
          );
          x = x === '∅' ? 'unknown' : x;
          return [
            moment(x).isValid()
              && ((this.query.dimensions[0]
                && !this.query.dimensions[0].includes(
                  'score',
                ))
                || !this.query.dimensions.length)
              ? formattedDate
              : x,
            item.value,
          ];
        })
        : [];
    },
    seriesPairs(resultSet) {
      // For bar charts
      return resultSet.series().map((seriesItem) => {
        let { dimension } = this.deconstructLabel(
          seriesItem.title,
        );

        const granularity = this.query.timeDimensions[0]?.granularity;

        if (
          this.query.timeDimensions.length
          && !this.query.timeDimensions[0].granularity
        ) {
          dimension = i18n(
            `widget.cubejs.${this.query.dimensions[0]}`,
          );
        }

        const seriesName = dimension && dimension !== 'unknown'
          ? dimension
          : i18n(
            `widget.cubejs.cubes.${
              this.query.measures[0].split('.')[0]}`,
          );

        return {
          name: seriesName,
          data: seriesItem.series.map((item) => {
            let { x } = item;
            const formattedDate = moment(x).format(
              this.getDateFormatForGranularity(granularity),
            );
            x = x === '∅' ? 'unknown' : x;
            return [
              moment(x).isValid()
              && ((this.query.dimensions[0]
                && !this.query.dimensions[0].includes(
                  'score',
                ))
                || !this.query.dimensions.length)
                ? formattedDate
                : x,
              item.value,
            ];
          }),
        };
      });
    },
    getDateFormatForGranularity(granularity) {
      const granularityFormat = {
        day: 'MMM DD',
        week: 'MMM DD',
        month: 'MMM YY',
        year: 'YYYY',
      };

      return granularity && granularity in granularityFormat
        ? granularityFormat[granularity]
        : 'MMM DD';
    },
    tableData(resultSet) {
      // For tables
      return resultSet.tablePivot().map((r) => Object.keys(r).reduce((acc, item) => {
        acc[i18n(`widget.cubejs.${item}`)] = r[item]
          ? r[item]
          : 'unknown';
        return acc;
      }, {}));
    },
    sortEngagementLevelAxisX(data) {
      let sortedData = data;

      if (this.chartType === 'bar') {
        sortedData = sortedData.map((i) => ({
          name: i.name,
          data:
              data.length > 0
                ? data[0].data.sort((a, b) => this.sortAlphabetically(a[0], b[0]))
                : [],
        }));
      } else if (this.chartType === 'table') {
        sortedData = data.sort((a, b) => this.sortAlphabetically(
          Object.values(a)[0],
          Object.values(b)[0],
        ));
      }

      return sortedData;
    },
    sortAlphabetically(a, b) {
      return Number(a) - Number(b);
    },
    deconstructLabel(label) {
      let dimension;
      if (label.split(',').length > 1) {
        [dimension] = label.split(',');
      } else {
        dimension = this.query.dimensions.length
          ? 'unknown'
          : undefined;
      }
      const cube = dimension && dimension !== 'unknown'
        ? label.split(',')[1].split('.')[0]
        : label.split('.')[0];
      const measure = label.split('.')[1];

      return {
        dimension,
        cube,
        measure,
      };
    },
    handleDuplicate() {
      this.$emit('duplicate', this.widget);
    },
    handleEdit() {
      this.$emit('edit', this.widget);
    },
    handleDelete() {
      this.$emit('delete', this.widget);
    },
  },
};
</script>

<style lang="scss" scoped>
.pie-chart {
  display: flex;
  justify-content: center;
  min-height: 300px;

  & > div {
    max-width: 450px;
  }
}

.cube-widget-chart {
  padding: 24px 0;
  min-height: 348px;
}
</style>
