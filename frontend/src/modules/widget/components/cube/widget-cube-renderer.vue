<template>
  <query-renderer
    v-if="cubejsApi"
    :cubejs-api="cubejsApi"
    :query="query"
  >
    <template #default="{ resultSet }">
      <app-widget-cube
        :show="show"
        :result-set="resultSet"
        :show-subtitle="showSubtitle"
        :widget="mapWidget(widget, resultSet)"
        :editable="editable"
        :chart-options="{
          ...mapOptions(widget, resultSet),
          ...chartOptions,
        }"
        :dashboard="dashboard"
        @edit="$emit('edit', widget)"
        @duplicate="$emit('duplicate', widget)"
        @delete="$emit('delete', widget)"
      />
    </template>
  </query-renderer>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { QueryRenderer } from '@cubejs-client/vue3';
import { mapWidget, chartOptions } from '@/modules/report/report-charts';
import WidgetCube from './widget-cube.vue';

export default {
  name: 'AppWidgetCubeRenderer',
  components: {
    QueryRenderer,
    'app-widget-cube': WidgetCube,
  },
  props: {
    show: {
      type: Boolean,
      default: true,
    },
    widget: {
      type: Object,
      default: null,
    },
    dashboard: {
      type: Boolean,
      default: false,
    },
    editable: {
      type: Boolean,
      default: false,
    },
    showSubtitle: {
      type: Boolean,
      default: true,
    },
    chartOptions: {
      type: Object,
      default: () => {},
    },
    subprojectId: {
      type: String,
      required: true,
    },
  },
  emits: ['edit', 'duplicate', 'delete'],
  data() {
    return {
      mapWidget,
      mapOptions: chartOptions,
    };
  },
  computed: {
    ...mapGetters({
      cubejsToken: 'widget/cubejsToken',
      cubejsApi: 'widget/cubejsApi',
    }),
    query() {
      // Exclude team members and bots in all queries
      // Include project group segments
      const widgetQuery = this.widget.settings.query;
      const filters = widgetQuery.filters || [];

      const hasTeamMemberFilter = filters.some((f) => f.member === 'Members.isTeamMember');
      const hasBotFilter = filters.some((f) => f.member === 'Members.isBot');

      if (!hasTeamMemberFilter) {
        filters.push({
          member: 'Members.isTeamMember',
          operator: 'equals',
          values: ['0'],
        });
      }

      if (!hasBotFilter) {
        filters.push({
          member: 'Members.isBot',
          operator: 'equals',
          values: ['0'],
        });
      }

      widgetQuery.filters = filters;

      return widgetQuery;
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
  },
};
</script>
