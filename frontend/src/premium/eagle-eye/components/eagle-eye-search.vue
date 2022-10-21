<template>
  <div class="eagle-eye-search">
    <app-keywords-input
      v-model="selectedKeywords"
      placeholder="Enter keywords, or topics..."
    />
    <app-eagle-eye-filter />
  </div>
</template>

<script>
import AppEagleEyeFilter from './eagle-eye-filter'
import { mapGetters, mapActions, mapState } from 'vuex'
import _ from 'lodash'

export default {
  name: 'AppEagleEyeSearch',
  components: {
    AppEagleEyeFilter
  },
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
          console.log(newValue)
          this.updateFilterAttribute({
            ...this.filter.attributes['keywords'],
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
      await this.doFetch({ keepPagination: false })
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

<style lang="scss">
.eagle-eye-search {
  @apply flex mt-6;
  .app-keywords-input {
    @apply flex-grow;
    .el-keywords-input-wrapper {
      @apply rounded-r-none;
    }
  }
}
</style>
