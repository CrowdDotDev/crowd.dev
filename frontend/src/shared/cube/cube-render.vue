<template>
  <query-renderer
    v-if="cubejsApi && cubejsToken && computedQuery"
    :cubejs-api="cubejsApi"
    :query="computedQuery"
  >
    <template #default="{ resultSet }">
      <div v-if="loadingData(resultSet)">
        <slot name="loading" />
      </div>
      <div v-else>
        <slot name="default" :result-set="resultSet" />
      </div>
    </template>
  </query-renderer>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { QueryRenderer } from '@cubejs-client/vue3';

export default {
  name: 'AppCubeRender',
  components: {
    QueryRenderer,
  },
  props: {
    query: {
      required: true,
      type: Object,
    },
    loading: {
      required: false,
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapGetters('widget', ['cubejsToken', 'cubejsApi']),
    computedQuery() {
      // Exclude team members in all queries
      const widgetQuery = this.query;
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
      const segments = ['4e6ec25b-877c-4746-8ae1-bba8fa40b2ec'];

      if (!widgetQuery.filters) {
        widgetQuery.segments = segments;
        widgetQuery.filters = [isTeamMemberFilter, isBot];
      } else {
        widgetQuery.filters.push(isTeamMemberFilter);
        widgetQuery.filters.push(isBot);
        widgetQuery.segments = segments;
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
    loadingData(resultSet) {
      return (
        !resultSet
        || resultSet.loadResponse === undefined
        || this.loading
      );
    },
  },
};
</script>

<style scoped></style>
