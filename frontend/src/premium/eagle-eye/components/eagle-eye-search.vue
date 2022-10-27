<template>
  <div class="eagle-eye-search">
    <app-keywords-input
      v-model="computedModel"
      placeholder="Enter keywords, or topics..."
    />
  </div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex'

export default {
  name: 'AppEagleEyeSearch',
  computed: {
    ...mapState({
      filter: (state) => state.eagleEye.filter
    }),
    ...mapGetters({
      activeView: 'eagleEye/activeView'
    }),
    computedModel: {
      get() {
        return this.filter.attributes?.keywords?.value || []
      },
      set(value) {
        this.updateFilterAttribute({
          name: 'keywords',
          label: 'Keywords',
          defaultValue: [],
          show: false,
          operator: 'overlap',
          defaultOperator: 'overlap',
          type: 'custom',
          value: value
        })
      }
    }
  },
  async created() {
    if (this.computedModel.length > 0) {
      await this.doFetch({})
    }
  },
  methods: {
    ...mapActions({
      updateFilterAttribute:
        'eagleEye/updateFilterAttribute',
      doFetch: 'eagleEye/doFetch'
    })
  }
}
</script>
