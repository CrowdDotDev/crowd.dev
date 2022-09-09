<template>
  <div class="filter">
    <app-teleport to="#teleport-activity-filter-toggle">
      <app-filter-toggle
        :active-filters-count="activeFiltersCount"
        :expanded="expanded"
        @click="doToggleExpanded"
      ></app-filter-toggle>
    </app-teleport>

    <el-dialog
      v-model="expanded"
      title="Activities Filters"
      :close-on-click-modal="false"
      @close="expanded = false"
    >
      <app-filter-preview
        :values="model"
        :fields="fields"
        @remove="doRemove($event)"
      ></app-filter-preview>
      <el-form
        ref="form"
        :label-position="labelPosition"
        :label-width="labelWidthFilter"
        :model="model"
        :rules="rules"
        @submit.prevent="doFilter"
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
                v-model="model[fields.timestampRange.name]"
                type="datetimerange"
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
                v-model="model[fields.communityMember.name]"
                :fetch-fn="fields.communityMember.fetchFn"
              ></app-autocomplete-one-input>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="filter-buttons">
          <el-button
            :disabled="loading"
            class="btn btn--primary mr-2"
            @click="doFilter"
          >
            <i class="ri-lg ri-check-line mr-1" />
            <app-i18n
              code="common.filters.apply"
            ></app-i18n>
          </el-button>

          <el-button
            :disabled="loading"
            class="btn btn--secondary"
            @click="doResetFilter"
          >
            <i class="ri-lg ri-arrow-go-back-line mr-1" />
            <app-i18n code="common.reset"></app-i18n>
          </el-button>
        </div>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
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
  name: 'AppActivityListFilter',
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

  methods: {
    ...mapActions({
      doReset: 'activity/list/doReset',
      doFetch: 'activity/list/doFetch'
    }),

    doToggleExpanded() {
      this.expanded = !this.expanded
    },

    doRemove(field) {
      delete this.model[field]
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
