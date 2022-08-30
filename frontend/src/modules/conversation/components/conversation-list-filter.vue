<template>
  <div class="filter">
    <Teleport to="#teleport-conversation-filter-toggle">
      <app-filter-toggle
        :active-filters-count="activeFiltersCount"
        :expanded="expanded"
        class="mr-3"
        @click="doToggleExpanded"
      ></app-filter-toggle>
    </Teleport>

    <el-dialog
      v-model:visible="expanded"
      title="Conversations Filters"
      @close="expanded = false"
    >
      <el-form
        ref="form"
        :label-position="labelPosition"
        :label-width="labelWidthFilter"
        :model="model"
        :rules="rules"
        @submit.prevent="doFilter"
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
            class="btn btn--primary mr-2"
            @click="doFilter"
          >
            <i class="ri-lg ri-check-line mr-1" />
            <app-i18n
              code="common.filters.apply"
            ></app-i18n>
          </el-button>

          <el-button
            :disabled="loading('table')"
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
  name: 'AppConversationListFilter',

  components: {
    AppPlatformAutocompleteInput
  },

  data() {
    return {
      rules: filterSchema.rules(),
      model: {},
      expanded: false
    }
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

  methods: {
    ...mapActions({
      doReset: 'conversation/doReset',
      doFetch: 'conversation/doFetch'
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
