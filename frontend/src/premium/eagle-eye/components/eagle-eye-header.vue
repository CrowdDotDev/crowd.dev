<template>
  <div class="eagle-eye-header">
    <div class="flex items-start">
      <h4>Eagle Eye</h4>
      <span class="text-sm font-medium text-brand-500 ml-2"
        >Free trial</span
      >
    </div>
    <div class="text-xs text-gray-500">
      Discover and engage with relevant content across
      various community platforms.
    </div>
    <el-tabs
      v-model="computedActiveTab"
      class="eagle-eye-header-tabs"
    >
      <el-tab-pane
        label="Inbox"
        name="inbox"
        label-class="app-content-title"
      >
      </el-tab-pane>
      <el-tab-pane
        label="Engaged"
        name="engaged"
        label-class="app-content-title"
      >
      </el-tab-pane>
      <el-tab-pane
        label="Excluded"
        name="rejected"
        label-class="app-content-title"
      >
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
export default {
  name: 'AppEagleEyeHeader',
  computed: {
    ...mapGetters({
      activeTab: 'eagleEye/activeTab'
    }),
    computedActiveTab: {
      get() {
        return this.activeTab
      },
      set(value) {
        this.$router.push({
          name: 'eagle-eye',
          query: { activeTab: value }
        })
        this.doChangeActiveTab(value)
      }
    }
  },
  methods: {
    ...mapActions({
      doChangeActiveTab: 'eagleEye/doChangeActiveTab'
    })
  }
}
</script>

<style lang="scss">
.eagle-eye-header {
  &-tabs {
    @apply mt-8;
  }
}
</style>
