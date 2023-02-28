<template>
  <el-select
    ref="input"
    :disabled="disabled"
    :remote-method="handleSearch"
    :model-value="modelValue"
    :clearable="true"
    :default-first-option="true"
    :filterable="true"
    :placeholder="placeholder || ''"
    :remote="true"
    :reserve-keyword="false"
    :allow-create="allowCreate"
    fit-input-width
    value-key="id"
    :class="inputClass"
    @change="onChange"
    @visible-change="onVisibleChange"
  >
    <Transition name="fade">
      <div
        v-show="isDropdownOpen"
        v-infinite-scroll="onScroll"
      >
        <el-option
          v-show="showCreateSuggestion"
          :label="currentQuery"
          :created="true"
          @mouseleave="onSelectMouseLeave"
        >
          <span class="prefix">{{ createPrefix }}</span>
          <span>{{ currentQuery }}</span>
        </el-option>
        <el-option
          v-for="record in localOptions"
          :key="record.id"
          :value="record"
          class="!px-5"
          @mouseleave="onSelectMouseLeave"
        >
          <span class="text-ellipsis overflow-hidden">
            {{ record.label }}
          </span>
        </el-option>
        <div
          v-if="loading"
          v-loading="loading"
          class="h-10"
        ></div>
        <div
          v-else-if="!loading && !localOptions.length"
          class="px-5 text-gray-400 text-xs w-full h-10 flex items-center justify-center"
        >
          No matches found
        </div>
      </div>
    </Transition>
  </el-select>
</template>

<script>
import isString from 'lodash/isString'
import { onSelectMouseLeave } from '@/utils/select'
import { mapState } from 'vuex'

const AUTOCOMPLETE_SERVER_FETCH_SIZE = 20

export default {
  name: 'AppAutocompleteOneInput',

  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    placeholder: {
      type: String,
      default: null
    },
    fetchFn: {
      type: Function,
      default: () => {}
    },
    totalFn: {
      type: Function,
      default: () => {}
    },
    createFn: {
      type: Function,
      default: () => {}
    },
    disabled: {
      type: Boolean,
      default: false
    },
    createIfNotFound: {
      type: Boolean,
      default: false
    },
    createPrefix: {
      type: String,
      default: 'Create'
    },
    inputClass: {
      type: String,
      default: ''
    },
    allowCreate: {
      type: Boolean,
      default: false
    },
    options: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      loading: false,
      localOptions: this.options ? this.options : [],
      currentQuery: '',
      limit: AUTOCOMPLETE_SERVER_FETCH_SIZE,
      isDropdownOpen: false,
      total: 0
    }
  },

  computed: {
    ...mapState({
      count: (state) => state.member.count
    }),
    showCreateSuggestion() {
      return (
        this.createIfNotFound &&
        this.currentQuery !== '' &&
        !this.localOptions.some(
          (o) =>
            o.label === this.currentQuery ||
            o === this.currentQuery
        )
      )
    }
  },

  async created() {
    // If total number of members is not known, fetch to know the number
    if (!this.count) {
      this.total = await this.totalFn()
    } else {
      this.total = this.count
    }
    await this.fetchAllResults()
  },

  methods: {
    async onChange(value) {
      const query = this.$refs.input.query

      if (
        typeof query === 'string' &&
        query !== '' &&
        this.createIfNotFound
      ) {
        // If value is a string, convert it to a db object
        const newItem = await this.createFn(value)
        this.localOptions.push(newItem)
        this.$emit('update:modelValue', newItem)
      } else {
        this.$emit('update:modelValue', value || null)
      }
    },

    async handleSearch(value) {
      if (
        (!isString(value) && value === '') ||
        value === undefined
      ) {
        return
      }

      // Reset limit when there is a new query
      this.limit = AUTOCOMPLETE_SERVER_FETCH_SIZE

      await this.handleServerSearch(value)
      this.localOptions.filter((item) =>
        String(item.label || '')
          .toLowerCase()
          .includes(String(value || '').toLowerCase())
      )
    },

    async fetchAllResults() {
      this.loading = true

      try {
        this.localOptions = await this.fetchFn(
          this.currentQuery,
          this.limit
        )
        this.loading = false
      } catch (error) {
        console.error(error)
        this.loading = false
      }
    },

    async handleServerSearch(value) {
      if (value === this.currentQuery) {
        return
      }

      this.currentQuery = value
      this.loading = true

      try {
        this.localOptions = await this.fetchFn(
          value,
          this.limit
        )

        this.loading = false
      } catch (error) {
        console.error(error)
        this.localOptions = []
        this.loading = false
      }
    },

    async onScroll() {
      // If limit is higher or equal to total number of members, do not fetch for more options
      if (this.limit >= this.total) {
        return
      }

      this.limit =
        this.limit + AUTOCOMPLETE_SERVER_FETCH_SIZE

      await this.fetchAllResults()
    },

    onVisibleChange(value) {
      this.isDropdownOpen = value
    },

    onSelectMouseLeave
  }
}
</script>
