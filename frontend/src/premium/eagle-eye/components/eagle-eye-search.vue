<template>
  <div class="eagle-eye-search">
    <app-keywords-input
      v-model="selectedKeywords"
      placeholder="Enter keywords, or topics..."
    />
  </div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex'
import _ from 'lodash'

export default {
  name: 'AppEagleEyeSearch',
  data() {
    return {
      selectedKeywords: []
    }
  },
  computed: {
    ...mapState({
      filter: (state) => state.eagleEye.filter
    }),
    ...mapGetters({
      activeView: 'eagleEye/activeView'
    })
  },
  watch: {
    selectedKeywords: {
      async handler(newValue, oldValue) {
        if (
          !_(newValue)
            .xorWith(oldValue, _.isEqual)
            .isEmpty()
        ) {
          this.updateFilterAttribute({
            name: 'keywords',
            label: 'Keywords',
            defaultValue: [],
            show: false,
            operator: 'textContains',
            defaultOperator: 'textContains',
            type: 'custom',
            value: newValue
          })
        }
      }
    },
    activeView: {
      handler(newValue, oldValue) {
        if (newValue !== oldValue) {
          this.selectedKeywords = []
        }
      }
    }
  },
  async created() {
    const savedKeywords = localStorage.getItem(
      'eagleEye_keywords'
    )
    this.selectedKeywords =
      savedKeywords && savedKeywords !== ''
        ? savedKeywords.split(',')
        : []

    if (savedKeywords) {
      this.updateFilterAttribute({
        name: 'keywords',
        label: 'Keywords',
        defaultValue: [],
        show: false,
        operator: 'textContains',
        defaultOperator: 'textContains',
        type: 'custom',
        value: savedKeywords
      })
    }
  },
  methods: {
    ...mapActions({
      doFetch: 'eagleEye/doFetch',
      updateFilterAttribute:
        'eagleEye/updateFilterAttribute'
    })
  }
}
</script>
