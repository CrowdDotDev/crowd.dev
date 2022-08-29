<template>
  <el-select
    :disabled="disabled"
    :loading="loading"
    :remote-method="handleSearch"
    :model-value="modelValue"
    clearable
    default-first-option
    filterable
    multiple
    :placeholder="placeholder || ''"
    remote
    :reserve-keyword="false"
    :allow-create="allowCreate"
    value-key="id"
    :class="inputClass"
    @change="onChange"
    @remove-tag="(tag) => $emit('remove-tag', tag)"
  >
    <el-option
      v-if="showCreateSuggestion"
      :value="currentQuery"
    >
      <span class="prefix">{{ createPrefix }}</span>
      <span>{{ currentQuery }}</span>
    </el-option>
    <el-option
      v-for="initialOption of initialOptions"
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
  name: 'AppAutocompleteManyInput',

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
    inMemoryFilter: {
      type: Boolean,
      default: true
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
<<<<<<< HEAD
  emits: ['remove-tag', 'update:modelValue'],
=======
  emits: ['remove-tag', 'input'],
>>>>>>> a061b75 (Fix warnings from shared modules)
  data() {
    return {
      loading: false,
      fullDataSource: this.options ? this.options : [],
      serverSideDataSource: [],
      inMemoryDataSource: this.options ? this.options : [],
      currentQuery: '',
      debouncedSearch: () => {}
    }
  },

  computed: {
    initialOptions() {
      if (!this.value || !this.value.length) {
        return []
      }

      return this.value.filter(
        (currentValue) =>
          !this.dataSource
            .map((item) => item.id)
            .includes(currentValue.id)
      )
    },

    dataSource() {
      if (this.inMemoryFilter) {
        return this.inMemoryDataSource
      }

      return this.serverSideDataSource
    },

    showCreateSuggestion() {
      return (
        this.createIfNotFound &&
        this.currentQuery !== '' &&
        !this.dataSource.some(
          (o) =>
            o.label === this.currentQuery ||
            o === this.currentQuery
        )
      )
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
      if (value.length === 0) {
        this.$emit('update:modelValue', [])
      }
      const promises = value.map(async (item) => {
        if (
          typeof item === 'string' &&
          item &&
          !this.inMemoryDataSource.some(
            (o) => o.label === item || o === item
          )
        ) {
          const newItem = await this.createFn(item)
          this.inMemoryDataSource.push(newItem)
          return newItem
        } else {
          return item
        }
      })
      Promise.all(promises).then((values) => {
        this.$emit('update:modelValue', values)
      })
    },

    async handleSearch(value) {
      if (!isString(value) && value === '') {
        return
      }

      if (this.inMemoryFilter) {
        await this.handleInMemorySearch(value)
      }

      await this.handleServerSearch(value)

      if (
        this.dataSource.length === 0 &&
        this.initialOptions.length === 0
      ) {
        this.data
      }
    },

    async handleInMemorySearch(value) {
      if (
        !this.fullDataSource ||
        !this.fullDataSource.length
      ) {
        await this.fetchAllResults()
      }

      if (this.fullDataSource) {
        this.inMemoryDataSource =
          this.fullDataSource.filter((item) =>
            String(item.label || '')
              .toLowerCase()
              .includes(String(value || '').toLowerCase())
          )
      }

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
