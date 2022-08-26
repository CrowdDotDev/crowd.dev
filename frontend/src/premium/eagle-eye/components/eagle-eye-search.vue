<template>
  <div class="eagle-eye-search">
    <div class="relative mx-3">
      <app-keywords-input
        v-model="selectedKeywords"
        placeholder="Enter keywords, or topics..."
      />
      <span class="text-xs text-gray-400"
        >Press ENTER or comma (,) to separate keywords</span
      >
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
  name: 'app-eagle-eye-search',
  components: {
    AppEagleEyeFilter
  },
  computed: {
    ...mapGetters({
      filter: 'eagleEye/filter'
    })
  },
  data() {
    return {
      selectedKeywords: []
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
        keywords: this.selectedKeywords
          .join(',')
      }
      await this.doFetch({
        rawFilter: filtersToApply,
        filter: filtersToApply
      })
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
  }
}
</script>

<style lang="scss">
.eagle-eye-search {
  @apply -mx-2 flex items-start mt-6;
}
</style>
