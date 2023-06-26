<template>
  <query-renderer
    v-if="cubejsApi"
    :cubejs-api="cubejsApi"
    :query="query"
  >
    <template #default="{ resultSet }">
      <app-widget-cube
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
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { getSegmentsFromProjectGroup } from '@/utils/segments';
import WidgetCube from './widget-cube.vue';

export default {
  name: 'AppWidgetCubeRenderer',
  components: {
    QueryRenderer,
    'app-widget-cube': WidgetCube,
  },
  props: {
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
      const lsSegmentsStore = useLfSegmentsStore();
      const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

      // Exclude team members and bots in all queries
      // Include project group segments
      const widgetQuery = this.widget.settings.query;
      const isTeamMemberFilter = {
        member: 'Members.isTeamMember',
        operator: 'equals',
        values: ['0'],
      };
      const isBot = {
        member: 'Members.isBot',
        operator: 'equals',
        values: ['0'],
      };

      const segments = {
        member: 'Segments.id',
        operator: 'equals',
        values: this.subprojectId ? [this.subprojectId] : getSegmentsFromProjectGroup(selectedProjectGroup.value),
      };

      if (!widgetQuery.filters) {
        widgetQuery.filters = [isTeamMemberFilter, isBot, segments];
      } else {
        widgetQuery.filters.push(isTeamMemberFilter);
        widgetQuery.filters.push(isBot);
        widgetQuery.filters.push(segments);
      }
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
