<template>
  <div class="filter">
    <portal to="user-filter-toggle">
      <app-filter-toggle
        :active-filters-count="activeFiltersCount"
        :expanded="expanded"
        class="mr-1"
        @click="doToggleExpanded"
      ></app-filter-toggle>
    </portal>

    <el-dialog
      v-model:visible="expanded"
      title="Activities Filters"
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
          <el-col :lg="12" :md="16" :sm="24">
            <el-form-item
              :label="fields.email.label"
              :prop="fields.email.name"
            >
              <el-input
                v-model="model[fields.email.name]"
              />
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="16" :sm="24">
            <el-form-item
              :label="fields.fullName.label"
              :prop="fields.fullName.name"
            >
              <el-input
                v-model="model[fields.fullName.name]"
              />
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="16" :sm="24">
            <el-form-item
              :label="fields.status.label"
              :prop="fields.status.name"
            >
              <el-select
                v-model="model[fields.status.name]"
                placeholder
              >
                <el-option :value="undefined">--</el-option>
                <el-option
                  v-for="option in fields.status.options"
                  :key="option.id"
                  :label="option.label"
                  :value="option.id"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="16" :sm="24">
            <el-form-item
              :label="fields.role.label"
              :prop="fields.role.name"
            >
              <el-select
                v-model="model[fields.role.name]"
                placeholder
              >
                <el-option :value="undefined">--</el-option>
                <el-option
                  v-for="option in fields.role.options"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="filter-buttons">
          <el-button
            :disabled="loading"
            icon="ri-lg ri-check-line"
            class="btn btn--primary mr-2"
            @click="doFilter"
          >
            <app-i18n
              code="common.filters.apply"
            ></app-i18n>
          </el-button>

          <el-button
            :disabled="loading"
            icon="ri-lg ri-arrow-go-back-line"
            class="btn btn--secondary"
            @click="doResetFilter"
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
import { UserModel } from '@/premium/user/user-model'

const { fields } = UserModel

const filterSchema = new FilterSchema([
  fields.email,
  fields.fullName,
  fields.status,
  fields.role
])

export default {
  name: 'AppUserListFilter',

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
      loading: 'user/list/loading',
      rawFilter: 'user/list/rawFilter'
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
      rawFilter
    })
  },

  methods: {
    ...mapActions({
      doReset: 'user/list/doReset',
      doFetch: 'user/list/doFetch'
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
