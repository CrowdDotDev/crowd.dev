<template>
  <query-renderer
    :cubejs-api="cubejsApi"
    :query="widget.settings.query"
  >
    <template #default="{ resultSet }">
      <app-widget-cube
        :result-set="resultSet"
        :show-subtitle="showSubtitle"
        :widget="widget"
        :editable="editable"
        :chart-options="chartOptions"
        :dashboard="dashboard"
        @edit="$emit('edit', widget)"
        @duplicate="$emit('duplicate', widget)"
        @delete="$emit('delete', widget)"
      />
    </template>
  </query-renderer>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { QueryRenderer } from '@cubejs-client/vue3'
import WidgetCube from './widget-cube'

export default {
  name: 'AppWidgetCubeRenderer',
  components: {
    QueryRenderer,
    'app-widget-cube': WidgetCube
  },
  props: {
    widget: {
      type: Object,
      default: null
    },
    dashboard: {
      type: Boolean,
      default: false
    },
    editable: {
      type: Boolean,
      default: false
    },
    showSubtitle: {
      type: Boolean,
      default: true
    },
    chartOptions: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['edit', 'duplicate', 'delete'],
  computed: {
    ...mapGetters({
      cubejsToken: 'widget/cubejsToken',
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
    })
  }
}
</script>
