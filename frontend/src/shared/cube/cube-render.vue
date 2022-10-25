<template>
  <query-renderer
    v-if="cubejsApi && cubejsToken && query"
    :cubejs-api="cubejsApi"
    :query="query"
  >
    <template #default="{ resultSet }">
      <div v-if="loadingData(resultSet)">
        <slot name="loading"></slot>
      </div>
      <div v-else>
        <slot name="default" :result-set="resultSet" />
      </div>
    </template>
  </query-renderer>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { QueryRenderer } from '@cubejs-client/vue3'
export default {
  name: 'AppCubeRender',
  components: {
    QueryRenderer
  },
  props: {
    query: {
      required: true,
      type: Object
    },
    loading: {
      required: false,
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      result: null,
      isLoading: true,
      data: null
    }
  },
  computed: {
    ...mapGetters('widget', ['cubejsToken', 'cubejsApi'])
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
    loadingData(resultSet) {
      return (
        !resultSet ||
        resultSet.loadResponse === undefined ||
        this.loading)
    }
  }
}
</script>

<style scoped></style>
