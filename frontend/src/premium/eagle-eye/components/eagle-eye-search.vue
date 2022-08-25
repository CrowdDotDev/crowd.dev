<template>
  <div class="eagle-eye-search">
    <app-autocomplete-many-input
      class="inline-input w-full mx-3"
      :fetchFn="handleSearchAutocomplete"
      v-model="selectedKeywords"
      placeholder="Enter keywords, or topics..."
      :triggerOnFocus="false"
      :inMemoryFilter="false"
      @remove-tag="handleRemoveKeyword"
    >
    </app-autocomplete-many-input>
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
import AppAutocompleteManyInput from '@/shared/form/autocomplete-many-input'
import AppEagleEyeFilter from './eagle-eye-filter'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'app-eagle-eye-search',
  components: {
    AppEagleEyeFilter,
    AppAutocompleteManyInput
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
    async handleSearchAutocomplete(query) {
      return [
        {
          id: query,
          label: query
        }
      ]
    },
    async doSearch() {
      const filtersToApply = {
        ...this.filter,
        keywords: this.selectedKeywords
          .map((k) => k.id)
          .join(',')
      }
      await this.doFetch({
        rawFilter: filtersToApply,
        filter: filtersToApply
      })
    },
    handleRemoveKeyword() {
      this.doSearch()
    }
  },
  async created() {
    const savedKeywords = localStorage.getItem(
      'eagleEye_keywords'
    )
    this.selectedKeywords =
      savedKeywords && savedKeywords !== ''
        ? savedKeywords.split(',').map((k) => {
            return {
              id: k,
              label: k
            }
          })
        : []

    if (savedKeywords) {
      await this.doSearch()
    }
  }
}
</script>

<style lang="scss">
.eagle-eye-search {
  @apply -mx-2 flex items-center mt-6;
}
</style>
