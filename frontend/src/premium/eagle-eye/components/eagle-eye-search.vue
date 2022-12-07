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
import { differenceWith, isEqual } from 'lodash'

export default {
  name: 'AppEagleEyeSearch',
  emits: ['update:is-button-disabled'],
  computed: {
    ...mapState({
      filter: (state) => state.eagleEye.filter
    }),
    ...mapGetters({
      activeView: 'eagleEye/activeView',
      showResetView: 'eagleEye/showResetView'
    }),
    filter() {
      return this.activeView.filter
    },
    computedModel: {
      get() {
        return this.filter.attributes?.keywords?.value || []
      },
      set(value) {
        this.updateFilterAttribute({
          name: 'keywords',
          label: 'Keywords',
          defaultValue:
            this.filter.attributes?.keywords
              ?.defaultValue || [],
          show: false,
          operator: 'overlap',
          defaultOperator: 'overlap',
          type: 'custom',
          value: value
        })
      }
    }
  },
  watch: {
    computedModel: {
      handler(newValue, oldValue) {
        if (
          this.showResetView &&
          newValue.length > 0 &&
          differenceWith(newValue, oldValue, isEqual)
        ) {
          this.$emit('update:is-button-disabled', false)
        } else {
          this.$emit('update:is-button-disabled', true)
        }
      },
      immediate: true
    }
  },
  async created() {
    if (this.computedModel.length > 0) {
      await this.doPopulate({})
      await this.doFetch({})
    }
  },
  methods: {
    ...mapActions({
      updateFilterAttribute:
        'eagleEye/updateFilterAttribute',
      doFetch: 'eagleEye/doFetch',
      doPopulate: 'eagleEye/doPopulate'
    })
  }
}
</script>
