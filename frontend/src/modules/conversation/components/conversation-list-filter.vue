<template>
  <div class="filter">
    <portal to="conversation-filter-toggle">
      <app-filter-toggle
        @click="doToggleExpanded"
        :activeFiltersCount="activeFiltersCount"
        :expanded="expanded"
        class="mr-3"
      ></app-filter-toggle>
    </portal>

    <el-dialog
      :visible.sync="expanded"
      title="Conversations Filters"
      @close="expanded = false"
    >
      <el-form
        :label-position="labelPosition"
        :label-width="labelWidthFilter"
        :model="model"
        :rules="rules"
        @submit.native.prevent="doFilter"
        ref="form"
      >
        <app-filter-preview
          :values="model"
          :fields="fields"
          :expanded="expanded"
          @click="doToggleExpanded()"
          @remove="doRemove($event)"
        ></app-filter-preview>

        <el-row type="flex">
          <el-col :lg="12" :md="12" :sm="12">
            <el-form-item
              :label="fields.title.label"
              :prop="fields.title.name"
            >
              <el-input
                v-model="model[fields.title.name]"
              />
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="12" :sm="12">
            <el-form-item
              label="Status"
              :prop="fields.published.name"
            >
              <el-select
                v-model="model[fields.published.name]"
                placeholder="Select the status"
              >
                <el-option
                  key="published"
                  label="Published"
                  :value="true"
                ></el-option>
                <el-option
                  key="unpublished"
                  label="Unpublished"
                  :value="false"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row type="flex">
          <el-col :lg="12" :md="12" :sm="12">
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
          <el-col :lg="12" :md="12" :sm="12">
            <el-form-item
              :label="fields.channel.label"
              :prop="fields.channel.name"
            >
              <el-input
                v-model="model[fields.channel.name]"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="filter-buttons">
          <el-button
            :disabled="loading('table')"
            @click="doFilter"
            icon="ri-lg ri-check-line"
            class="btn btn--primary mr-2"
          >
            <app-i18n
              code="common.filters.apply"
            ></app-i18n>
          </el-button>

          <el-button
            :disabled="loading('table')"
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
import { i18n } from '@/i18n'
import { ConversationModel } from '@/modules/conversation/conversation-model'
import AppPlatformAutocompleteInput from '@/shared/form/platform-autocomplete-input'

const { fields } = ConversationModel

const filterSchema = new FilterSchema([
  fields.title,
  fields.platform,
  fields.channel,
  fields.published
])

export default {
  name: 'app-conversation-list-filter',

  data() {
    return {
      rules: filterSchema.rules(),
      model: {},
      expanded: false
    }
  },

  components: {
    AppPlatformAutocompleteInput
  },

  computed: {
    ...mapGetters({
      labelPosition: 'layout/labelPosition',
      labelWidthFilter: 'layout/labelWidthFilter',
      loading: 'conversation/loading',
      rawFilter: 'conversation/rawFilter',
      filter: 'conversation/filter'
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

    const rawFilter = this.model
    const filter = filterSchema.cast(this.model)
    return this.doFetch({
      filter,
      rawFilter,
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
        if (newValue.published !== oldValue.published) {
          this.model.published =
            newValue.published === undefined
              ? null
              : newValue.published
        }
      }
    }
  },

  methods: {
    ...mapActions({
      doReset: 'conversation/doReset',
      doFetch: 'conversation/doFetch'
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
      const filter = filterSchema.cast(this.model)
      return this.doFetch({
        filter,
        rawFilter
      })
    },

    i18n(code) {
      return i18n(code)
    }
  }
}
</script>

<style></style>
