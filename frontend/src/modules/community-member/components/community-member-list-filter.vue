<template>
  <div class="filter">
    <app-teleport
      to="#teleport-community-member-filter-toggle"
    >
      <app-filter-toggle
        :active-filters-count="activeFiltersCount"
        :expanded="expanded"
        class="mr-1"
        @click="doToggleExpanded"
      ></app-filter-toggle>
    </app-teleport>
    <el-dialog
      v-model="expanded"
      title="Members Filters"
      @close="expanded = false"
    >
      <el-form
        v-if="expanded"
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
          <el-col :md="12" :sm="24">
            <el-form-item
              :label="fields.username.label"
              :prop="fields.username.name"
            >
              <el-input
                v-model="model[fields.username.name]"
                placeholder="john_doe"
              />
            </el-form-item>
          </el-col>

          <el-col :md="12" :sm="24">
            <el-form-item
              v-if="lookalike"
              label="Score Range"
              :prop="fields.scoreRange.name"
            >
              <app-number-range-input
                v-model="model[fields.scoreRange.name]"
              />
            </el-form-item>
            <el-form-item
              v-else
              label="Engagement Level"
              label-width="150"
            >
              <app-community-member-engagement-level-filter
                v-model="model[fields.scoreRange.name]"
              />
            </el-form-item>
          </el-col>

          <el-col :sm="24">
            <el-form-item
              label="Reach Range"
              :prop="fields.reachRange.name"
            >
              <app-number-range-input
                v-model="model[fields.reachRange.name]"
              />
            </el-form-item>
          </el-col>

          <el-col v-if="!lookalike" :sm="24">
            <el-form-item
              label="# of Activities"
              :prop="fields.activitiesCountRange.name"
            >
              <app-number-range-input
                v-model="
                  model[fields.activitiesCountRange.name]
                "
              />
            </el-form-item>
          </el-col>

          <el-col :sm="24">
            <el-form-item
              label="Tags"
              :prop="fields.tags.name"
            >
              <app-tag-autocomplete-input
                v-model="model[fields.tags.name]"
                :fetch-fn="fields.tags.fetchFn"
                :mapper-fn="fields.tags.mapperFn"
                placeholder="Type to search/create tags"
              >
              </app-tag-autocomplete-input>
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
import { CommunityMemberModel } from '@/modules/community-member/community-member-model'
import AppTagAutocompleteInput from '@/modules/tag/components/tag-autocomplete-input'
import AppNumberRangeInput from '@/shared/form/number-range-input'
import AppCommunityMemberEngagementLevelFilter from './community-member-engagement-level-filter'

const { fields } = CommunityMemberModel

const filterSchema = new FilterSchema([
  fields.username,
  fields.tags,
  fields.scoreRange,
  fields.activitiesCountRange,
  fields.reachRange
])

export default {
  name: 'AppCommunityMemberListFilter',
  components: {
    AppNumberRangeInput,
    AppTagAutocompleteInput,
    AppCommunityMemberEngagementLevelFilter
  },
  props: {
    lookalike: {
      type: Boolean,
      default: false
    }
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
      loading: 'communityMember/list/loading',
      rawFilter: 'communityMember/list/rawFilter'
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

  methods: {
    ...mapActions({
      doReset: 'communityMember/list/doReset',
      doFetch: 'communityMember/list/doFetch'
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
    }
  }
}
</script>

<style></style>
