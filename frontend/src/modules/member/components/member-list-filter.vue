<template>
  <div class="member-filter list-filter mb-8">
    <el-input
      v-model="model.query"
      placeholder="Search members"
      :prefix-icon="SearchIcon"
    >
      <template #append>
        <el-button class="btn btn--secondary btn--md"
          ><i class="ri-lg ri-filter-3-line mr-2"></i>
          Filters</el-button
        >
      </template>
    </el-input>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex'
import { FilterSchema } from '@/shared/form/filter-schema'
import { MemberModel } from '@/modules/member/member-model'

const { fields } = MemberModel

const filterSchema = new FilterSchema([
  fields.username,
  fields.tags,
  fields.scoreRange,
  fields.activitiesCountRange,
  fields.reachRange
])

import { h } from 'vue'

const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  []
)

export default {
  name: 'AppMemberListFilter',
  data() {
    return {
      expanded: false,
      rules: filterSchema.rules(),
      model: {},
      SearchIcon
    }
  },

  computed: {
    ...mapState({
      loading: (state) => state.member.list.loading,
      rawFilter: (state) => state.member.rawFilter
    }),
    ...mapGetters({
      labelPosition: 'layout/labelPosition',
      labelWidthFilter: 'layout/labelWidthFilter'
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
      doReset: 'member/doReset',
      doFetch: 'member/doFetch'
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
