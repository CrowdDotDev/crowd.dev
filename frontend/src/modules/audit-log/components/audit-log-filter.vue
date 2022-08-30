<template>
  <div class="filter">
    <app-filter-preview
      :values="model"
      :fields="fields"
      :expanded="expanded"
      @click="doToggleExpanded()"
      @remove="doRemove($event)"
    ></app-filter-preview>
    <el-form
      v-if="expanded"
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
            :label="fields.entityNames.label"
            :prop="fields.entityNames.name"
          >
            <el-select
              v-model="model[fields.entityNames.name]"
              :no-data-text="
                i18n('auditLog.entityNamesHint')
              "
              allow-create
              default-first-option
              filterable
              multiple
              placeholder
            ></el-select>
          </el-form-item>
        </el-col>
        <el-col :lg="12" :md="16" :sm="24">
          <el-form-item
            :label="fields.createdByEmail.label"
            :prop="fields.createdByEmail.name"
          >
            <el-input
              v-model="model[fields.createdByEmail.name]"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="12" :md="16" :sm="24">
          <el-form-item
            :label="fields.entityId.label"
            :prop="fields.entityId.name"
          >
            <el-input
              v-model="model[fields.entityId.name]"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="12" :md="16" :sm="24">
          <el-form-item
            :label="fields.action.label"
            :prop="fields.action.name"
          >
            <el-input v-model="model[fields.action.name]" />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="filter-buttons">
        <el-button
          :disabled="loading"
          class="btn btn--primary"
          @click="doFilter"
        >
          <i class="ri-search-line mr-1" />
          <app-i18n code="common.filters.apply"></app-i18n>
        </el-button>

        <el-button
          :disabled="loading"
          @click="doResetFilter"
        >
          <i class="ri-lg ri-arrow-go-back-line mr-1" />
          <app-i18n code="common.reset"></app-i18n>
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { FilterSchema } from '@/shared/form/filter-schema'
import { AuditLogModel } from '@/modules/audit-log/audit-log-model'
import { i18n } from '@/i18n'

const { fields } = AuditLogModel

const filterSchema = new FilterSchema([
  fields.timestampRange,
  fields.createdByEmail,
  fields.entityId,
  fields.action,
  fields.entityNames
])

export default {
  name: 'AppAuditLogFilter',

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
      loading: 'auditLog/loading',
      rawFilter: 'auditLog/rawFilter'
    }),

    fields() {
      return fields
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
      rawFilter
    })
  },

  methods: {
    ...mapActions({
      doReset: 'auditLog/doReset',
      doFetch: 'auditLog/doFetch'
    }),

    doToggleExpanded() {
      this.expanded = !this.expanded
    },

    doRemove(field) {
      this.model[field] = null
      this.expanded = false
      const rawFilter = this.model
      const filter = filterSchema.cast(this.model)
      return this.doFetch({
        filter,
        rawFilter
      })
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
