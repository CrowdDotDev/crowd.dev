<template>
  <el-select
    :disabled="disabled"
    :loading="loading"
    :remote-method="handleSearch"
    :model-value="modelValue"
    :placeholder="placeholder || ''"
    clearable
    default-first-option
    filterable
    remote
    :allow-create="allowCreate"
    :reserve-keyword="false"
    value-key="id"
    :class="inputClass"
    @change="onChange"
  >
    <el-option
      v-if="initialOption"
      :key="initialOption.id"
      :label="initialOption.label"
      :value="initialOption"
    ></el-option>
    <el-option
      v-for="record in dataSource"
      :key="record.id"
      :label="record.label"
      :value="record"
    ></el-option>
  </el-select>
</template>

<script>
import debounce from 'lodash/debounce'
import isString from 'lodash/isString'

const AUTOCOMPLETE_SERVER_FETCH_SIZE = 100

export default {
  name: 'AppAutocompleteOneInput',

  props: {
    modelValue: {
      type: Object,
      default: () => {}
    },
    placeholder: {
      type: String,
      default: null
    },
    options: {
      type: Array,
      default: () => []
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
    inMemoryFilter: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    inputClass: {
      type: String,
      default: ''
    },
    allowCreate: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],

  data() {
    return {
      loading: false,
      fullDataSource: this.options ? this.options : [],
      serverSideDataSource: [],
      inMemoryDataSource: this.options ? this.options : [],
      currentQuery: 'NOT_INITIALIZED',
      debouncedSearch: () => {
        return
      }
    }
  },

  computed: {
    initialOption() {
      if (
        this.modelValue &&
        !this.dataSource
          .map((item) => item.id)
          .includes(this.value.id)
      ) {
        return this.modelValue
      }

      return null
    },

    dataSource() {
      if (this.inMemoryFilter) {
        return this.inMemoryDataSource
      }

      return this.serverSideDataSource
    }
  },

  mounted() {
    this.debouncedSearch = debounce(
      this.handleSearch.bind(this),
      300
    )
  },

  methods: {
    async onChange(value) {
      if (typeof value === 'string' && value) {
        // If value is a string, convert it to a db object
        const newItem = await this.createFn(value)
        this.inMemoryDataSource.push(newItem)
        this.$emit('update:modelValue', newItem)
      } else {
        this.$emit('update:modelValue', value || null)
      }
    },

    async handleSearch(value) {
      if (!isString(value) && value === '') {
        return
      }

      if (this.inMemoryFilter) {
        return this.handleInMemorySearch(value)
      }

      return this.handleServerSearch(value)
    },

    async handleInMemorySearch(value) {
      if (
        !this.fullDataSource ||
        !this.fullDataSource.length
      ) {
        await this.fetchAllResults()
      }

      this.inMemoryDataSource = this.fullDataSource.filter(
        (item) =>
          String(item.label || '')
            .toLowerCase()
            .includes(String(value || '').toLowerCase())
      )

      this.loading = false
    },

    async fetchAllResults() {
      this.loading = true

      try {
        this.fullDataSource = await this.fetchFn()
        this.loading = false
      } catch (error) {
        console.error(error)
        this.fullDataSource = []
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
        const serverSideDataSource = await this.fetchFn(
          value,
          AUTOCOMPLETE_SERVER_FETCH_SIZE
        )

        if (this.currentQuery === value) {
          this.serverSideDataSource = serverSideDataSource
          this.loading = false
        }
      } catch (error) {
        console.error(error)

        if (this.currentQuery === value) {
          this.serverSideDataSource = []
          this.loading = false
        }
      }
    }
  }
}
</script>

<style></style>
