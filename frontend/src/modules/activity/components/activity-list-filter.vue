<template>
  <div class="filter">
    <portal to="activity-filter-toggle">
      <app-filter-toggle
        @click="doToggleExpanded"
        :activeFiltersCount="activeFiltersCount"
        :expanded="expanded"
      ></app-filter-toggle>
    </portal>

    <el-dialog
      :visible.sync="expanded"
      title="Activities Filters"
      @close="expanded = false"
    >
      <app-filter-preview
        :values="model"
        :fields="fields"
        @remove="doRemove($event)"
      ></app-filter-preview>
      <el-form
        :label-position="labelPosition"
        :label-width="labelWidthFilter"
        :model="model"
        :rules="rules"
        @submit.native.prevent="doFilter"
        ref="form"
      >
        <el-row type="flex">
          <el-col :lg="12" :md="16" :sm="24">
            <el-form-item
              :label="fields.type.label"
              :prop="fields.type.name"
            >
              <el-input v-model="model[fields.type.name]" />
            </el-form-item>
          </el-col>

          <el-col :lg="12" :md="16" :sm="24">
            <el-form-item
              :label="fields.timestampRange.label"
              :prop="fields.timestampRange.name"
            >
              <el-date-picker
                type="datetimerange"
                v-model="model[fields.timestampRange.name]"
              ></el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :lg="12" :md="16" :sm="24">
            <el-form-item
              :label="fields.platform.label"
              :prop="fields.platform.name"
            >
              <app-platform-autocomplete-input
                v-model="model[fields.platform.name]"
                placeholder="Type to search platform"
              />
            </el-form-item>
          </el-col>

          <!-- TODO: Do a proper custom attribute filter
          <el-col :lg="12" :md="16" :sm="24">
            <el-form-item
              :label="fields.info.label"
              :prop="fields.info.name"
            >
              <el-input v-model="model[fields.info.name]" />
            </el-form-item>
          </el-col>
          -->

          <el-col :lg="12" :md="16" :sm="24">
            <el-form-item
              :label="fields.communityMember.label"
              :prop="fields.communityMember.name"
            >
              <app-autocomplete-one-input
                :fetchFn="fields.communityMember.fetchFn"
                v-model="model[fields.communityMember.name]"
              ></app-autocomplete-one-input>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="filter-buttons">
          <el-button
            :disabled="loading"
            @click="doFilter"
            icon="ri-lg ri-check-line"
            class="btn btn--primary mr-2"
          >
            <app-i18n
              code="common.filters.apply"
            ></app-i18n>
          </el-button>

          <el-button
            :disabled="loading"
            @click="doResetFilter"
            icon="ri-lg ri-arrow-go-back-line"
            class="btn btn--secondary"
          >
            <app-i18n code="common.reset"></app-i18n>
          </el-button>
        </div>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import { FilterSchema } from '@/shared/form/filter-schema'
import { ActivityModel } from '@/modules/activity/activity-model'
import AppFilterToggle from '../../../shared/filter/filter-toggle'
import AppPlatformAutocompleteInput from '@/shared/form/platform-autocomplete-input'

const { fields } = ActivityModel

const filterSchema = new FilterSchema([
  fields.type,
  fields.timestampRange,
  fields.platform,
  fields.info,
  fields.communityMember
])

export default {
  name: 'app-activity-list-filter',
  components: {
    AppPlatformAutocompleteInput,
    AppFilterToggle
  },
  data() {
    return {
      expanded: false,
      rules: filterSchema.rules(),
      model: {}
    }
  },

  computed: {
    ...mapGetters({
      labelPosition: 'layout/labelPosition',
      labelWidthFilter: 'layout/labelWidthFilter',
      loading: 'activity/list/loading',
      rawFilter: 'activity/list/rawFilter',
      filter: 'activity/list/filter'
    }),

    fields() {
      return fields
    },

    activeFiltersCount() {
      return Object.values(this.model).filter(
        (v) => v !== undefined && v !== null
      ).length
    }
  },

  async mounted() {
    this.model = filterSchema.initialValues(
      this.rawFilter,
      this.$route.query
    )

    const filter = filterSchema.cast(this.model)
    return this.doFetch({
      filter,
      keepPagination: true
    })
  },

  watch: {
    filter: {
      deep: true,
      handler(newValue, oldValue) {
        if (newValue.platform !== oldValue.platform) {
          this.model.platform =
            newValue.platform === undefined
              ? null
              : newValue.platform
        }
      }
    }
  },

  methods: {
    ...mapActions({
      doReset: 'activity/list/doReset',
      doFetch: 'activity/list/doFetch'
    }),

    doToggleExpanded() {
      this.expanded = !this.expanded
    },

    doRemove(field) {
      Vue.delete(this.model, field)
    },

    async doResetFilter() {
      this.expanded = false
      this.model = filterSchema.initialValues()
      this.$refs.form.clearValidate()
      return this.doReset()
    },

    async doFilter() {
      try {
        await this.$refs.form.validate()
        this.$refs.form.clearValidate()
      } catch (error) {
        return
      }

      this.expanded = false
      const rawFilter = this.model
      const filter = filterSchema.cast({
        ...this.model,
        platform: this.model.platform
          ? this.model.platform
          : undefined
      })
      return this.doFetch({
        filter,
        rawFilter
      })
    }
  }
}
</script>

<style></style>
