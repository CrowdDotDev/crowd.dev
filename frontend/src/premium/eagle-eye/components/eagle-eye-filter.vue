<template>
  <div class="eagle-eye-filter">
    <app-filter-toggle
      :active-filters-count="activeFiltersCount"
      :expanded="expanded"
      @click="expanded = true"
    ></app-filter-toggle>
    <el-dialog v-model:visible="expanded" title="Filters">
      <el-form class="form">
        <el-form-item label="Platform">
          <el-checkbox-group v-model="platforms">
            <div class="flex items-center flex-wrap">
              <el-checkbox
                v-for="source of eagleEyeSources"
                :key="source.platform"
                :label="source.platform"
                class="w-1/2"
                :disabled="
                  !['devto', 'hacker_news'].includes(
                    source.platform
                  )
                "
              >
                <div class="flex items-center relative">
                  <img
                    :src="source.image"
                    :alt="`${source.platform} logo`"
                    class="block w-6 h-auto mr-2"
                  />
                  <span class="block">{{
                    source.name
                  }}</span>
                  <span
                    v-if="
                      !['devto', 'hacker_news'].includes(
                        source.platform
                      )
                    "
                    class="text-2xs absolute right-0 top-0 -mr-8 text-gray-500"
                    >Soon</span
                  >
                </div>
              </el-checkbox>
            </div>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="Date published">
          <el-radio
            v-model="nDays"
            :label="1"
            border
            size="medium"
            >Last 24 hours</el-radio
          >
          <el-radio
            v-model="nDays"
            :label="3"
            border
            size="medium"
            >Last 3 days</el-radio
          >
          <el-radio
            v-model="nDays"
            :label="7"
            border
            size="medium"
            >Last 7 days</el-radio
          >
          <el-radio
            v-model="nDays"
            :label="30"
            border
            size="medium"
            >Last 30 days</el-radio
          >
        </el-form-item>
      </el-form>
      <div class="flex items-center justify-end mt-12">
        <el-button
          class="btn btn--primary mr-3"
          icon="ri-lg ri-check-line"
          @click="handleApplyClick"
        >
          Apply filters
        </el-button>
        <el-button
          class="btn btn--secondary"
          icon="ri-lg ri-arrow-go-back-line"
          @click="handleResetClick"
        >
          Reset
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import eagleEyeSourcesJson from '@/jsons/eagle-eye-sources.json'
import { mapActions, mapGetters } from 'vuex'
export default {
  name: 'AppEagleEyeFilter',
  data() {
    return {
      expanded: false,
      platforms: ['hacker_news', 'devto'],
      nDays: 1
    }
  },
  computed: {
    ...mapGetters({
      filter: 'eagleEye/filter'
    }),
    eagleEyeSources() {
      return eagleEyeSourcesJson
    },
    activeFiltersCount() {
      let activeFilters = 0

      activeFilters =
        this.filter.nDays !== 1
          ? activeFilters + 1
          : activeFilters
      activeFilters =
        this.filter.platforms &&
        this.filter.platforms.length !== 2
          ? activeFilters + 1
          : activeFilters

      return activeFilters
    }
  },
  watch: {
    filter: {
      handler(newValue, oldValue) {
        if (newValue.nDays !== oldValue.nDays) {
          this.nDays = newValue.nDays
        }
        this.platforms = newValue.platforms
          ? newValue.platforms
          : ['hacker_news', 'devto']
      },
      deep: true
    },
    'filter.platforms': {
      handler(newValue) {
        this.platforms = [...newValue]
      },
      deep: true
    }
  },
  methods: {
    ...mapActions({
      doReset: 'eagleEye/doReset',
      doFetch: 'eagleEye/doFetch'
    }),
    async handleApplyClick() {
      const filtersToApply = {
        ...this.filter,
        platforms: this.platforms,
        nDays: this.nDays
      }
      this.expanded = false
      await this.doFetch({
        rawFilter: filtersToApply,
        filter: filtersToApply
      })
    },
    async handleResetClick() {
      this.platforms = ['hacker_news', 'devto']
      this.nDays = 1
      await this.doReset()
    }
  }
}
</script>

<style lang="scss">
.eagle-eye-filter {
  .el-checkbox {
    @apply mr-0 flex items-center mb-4;
  }
}
</style>
