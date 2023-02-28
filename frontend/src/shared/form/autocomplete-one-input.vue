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
          :label="record.label"
          :value="record"
          @mouseleave="onSelectMouseLeave"
        >
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
    mapperFn: {
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
      isDropdownOpen: false
    }
  },

  computed: {
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
      if (!isString(value) && value === '') {
        return
      }

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
      // If options are fewer than the limit, do not fetch for more options
      if (this.limit - this.localOptions.length > 0) {
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
