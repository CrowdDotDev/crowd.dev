<template>
  <div class="eagle-eye-search">
    <div class="flex-grow mx-3">
      <app-keywords-input
        v-model="selectedKeywords"
        placeholder="Enter keywords, or topics..."
      />
    </div>
    <app-eagle-eye-filter />
    <el-button
      class="btn btn--primary mx-3"
      @click="doSearch"
    >
      Search
    </el-button>
  </div>
</template>

<script>
import AppEagleEyeFilter from './eagle-eye-filter'
import { mapGetters, mapActions } from 'vuex'

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
    ...mapGetters({
      filter: 'eagleEye/filter',
      activeTab: 'eagleEye/activeTab'
    })
  },
  watch: {
    activeTab: {
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
      await this.doSearch()
    }
  },
  methods: {
    ...mapActions({
      doPopulate: 'eagleEye/doPopulate',
      doFetch: 'eagleEye/doFetch'
    }),
    async doSearch() {
      const filtersToApply = {
        ...this.filter,
        keywords: this.selectedKeywords.join(',')
      }
      await this.doFetch({
        rawFilter: filtersToApply,
        filter: filtersToApply
      })
    }
  }
}
</script>

<style lang="scss">
.eagle-eye-search {
  @apply -mx-3 flex items-start mt-6;
}
</style>
