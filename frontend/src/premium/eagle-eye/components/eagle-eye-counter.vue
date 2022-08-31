<template>
  <div>
    <div v-if="count > 0" class="text-gray-600 text-sm">
      {{ count }}
      {{ typeOfPostsFound }} posts
      {{
        filter.keywords && filter.keywords.length > 0
          ? 'found'
          : ''
      }}
      <span v-if="activeTab === 'inbox'"
        >・ {{ timeframe }}</span
      >
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'AppEagleEyeCounter',
  computed: {
    ...mapGetters({
      count: 'eagleEye/count',
      filter: 'eagleEye/filter',
      activeTab: 'eagleEye/activeTab'
    }),
    typeOfPostsFound() {
      if (this.activeTab === 'inbox') {
        return this.hasKeywords ? 'relevant' : 'recommended'
      } else if (this.activeTab === 'rejected') {
        return 'excluded'
      } else if (this.activeTab === 'engaged') {
        return 'engaged'
      } else {
        return ''
      }
    },
    hasKeywords() {
      return Object.keys(this.filter).includes('keywords')
    },
    timeframe() {
      if (this.filter.nDays === 1) {
        return 'Last 24 hours'
      } else if (this.filter.nDays === 3) {
        return 'Last 3 days'
      } else if (this.filter.nDays === 7) {
        return 'Last 7 days'
      } else if (this.filter.nDays === 30) {
        return 'Last 30 days'
      } else {
        return ''
      }
    }
  }
}
</script>
