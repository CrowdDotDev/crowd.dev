<template>
  <query-renderer
    v-if="cubejsApi && cubejsToken && query"
    :cubejs-api="cubejsApi"
    :query="query"
  >
    <template #default="{ resultSet }">
      <div :set="loadingData(resultSet)"></div>
      <div v-if="isLoading">
        <slot name="loading"></slot>
      </div>
      <div v-else>
        <slot name="default" :result-set="result" />
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
      if (
        JSON.stringify(resultSet) ===
        JSON.stringify(this.result)
      ) {
        return
      }
      this.result = resultSet
      this.isLoading =
        !resultSet ||
        resultSet.loadResponse === undefined ||
        this.loading
    }
  }
}
</script>

<style scoped></style>
