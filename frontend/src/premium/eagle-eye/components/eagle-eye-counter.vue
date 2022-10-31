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
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
export default {
  name: 'AppEagleEyeCounter',
  computed: {
    ...mapState({
      count: (state) => state.eagleEye.count,
      filter: (state) => state.eagleEye.filter
    }),
    ...mapGetters({
      activeView: 'eagleEye/activeView'
    }),
    typeOfPostsFound() {
      if (this.activeView === 'inbox') {
        return this.hasKeywords ? 'relevant' : 'recommended'
      } else if (this.activeView === 'rejected') {
        return 'excluded'
      } else if (this.activeView === 'engaged') {
        return 'engaged'
      } else {
        return ''
      }
    },
    hasKeywords() {
      return Object.keys(this.filter).includes('keywords')
    }
  }
}
</script>
