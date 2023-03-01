<template>
  <el-select
    ref="input"
    :disabled="disabled || initialLoading"
    :loading="loading || initialLoading"
    :remote-method="handleSearch"
    :model-value="initialLoading ? null : model"
    :clearable="true"
    :default-first-option="true"
    :filterable="true"
    :multiple="true"
    :placeholder="placeholder || ''"
    :remote="true"
    :reserve-keyword="false"
    :allow-create="allowCreate"
    :suffix-icon="initialLoading ? 'app-loader' : null"
    :remote-show-suffix="initialLoading"
    :collapse-tags="shouldCollapseTags"
    :collapse-tags-tooltip="shouldCollapseTags"
    value-key="id"
    class="autocomplete-many-input"
    :class="{
      [inputClass]: true,
      expand: collapseTags && isSelectFocused,
      empty: collapseTags && !model.length
    }"
    @change="onChange"
    @remove-tag="(tag) => $emit('remove-tag', tag)"
    @visible-change="onVisibleChange"
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
      v-for="record in availableOptions"
      :key="record.id"
      :label="record.label"
      :value="record"
      @mouseleave="onSelectMouseLeave"
    >
      <slot name="option" :item="record"></slot>
    </el-option>
  </el-select>
</template>

<script>
import { onSelectMouseLeave } from '@/utils/select'

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
    },
    collapseTags: {
      type: Boolean,
      default: false
    },
    allowFetchNotIncludedTags: {
      type: Boolean,
      default: true
    },
    parseModel: {
      type: Boolean,
      default: false
    }
  },
  emits: ['remove-tag', 'update:modelValue'],
  data() {
    return {
      initialLoading: false,
      loading: false,
      localOptions: this.options ? this.options : [],
      filterableOptions: this.options ? this.options : [],
      currentQuery: '',
      isSelectFocused: false
    }
  },

  computed: {
    showCreateSuggestion() {
      return (
        this.createIfNotFound &&
        !!this.currentQuery &&
        !this.localOptions.some(
          (o) =>
            o.label === this.currentQuery ||
            o === this.currentQuery
        )
      )
    },
    shouldCollapseTags() {
      return this.collapseTags && !this.isSelectFocused
    },
    model: {
      get() {
        return this.modelValue.map((v) => {
          if (this.parseModel) {
            return {
              id: v,
              label: v
            }
          }

          return v
        })
      },
      set(v) {
        const updatedValue = this.parseModel
          ? v.map((value) => value.label)
          : v

        this.$emit('update:modelValue', updatedValue)
      }
    },
    availableOptions() {
      if (this.currentQuery) {
        return this.filterableOptions
      }

      return this.localOptions
    }
  },

  async created() {
    await this.fetchAllResults()
  },

  methods: {
    async onChange(value) {
      const query = this.$refs.input.query
      if (value.length === 0) {
        this.model = []
      }
      const promises = value.map(async (item) => {
        if (
          item === false &&
          query !== '' &&
          this.createIfNotFound
        ) {
          // item is created/typed from user
          const newItem = await this.createFn(query)
          this.localOptions.push(newItem)
          return newItem
        } else {
          return item
        }
      })
      Promise.all(promises).then((values) => {
        this.model = values
      })
    },

    async handleSearch(query) {
      if (query === this.currentQuery) {
        return
      }

      this.currentQuery = query

      if (query) {
        setTimeout(() => {
          this.filterableOptions = this.localOptions.filter(
            (item) => {
              return item.label
                .toLowerCase()
                .includes(query.toLowerCase())
            }
          )
        }, 200)
      } else {
        await this.handleServerSearch(query)
      }
    },

    async fetchNotIncludedTags(response) {
      if (!this.allowFetchNotIncludedTags) {
        return
      }

      const notIncluded = this.model.filter(
        (m) =>
          response.findIndex((r) => r.id === m.id) === -1
      )

      if (notIncluded.length) {
        const notIncludedResponse = await this.fetchFn(
          notIncluded
        )

        this.localOptions.unshift(...notIncludedResponse)
      }
    },

    async fetchAllResults() {
      this.initialLoading = true

      try {
        const response = await this.fetchFn()

        this.localOptions = response

        await this.fetchNotIncludedTags(response)

        this.initialLoading = false
      } catch (error) {
        console.error(error)
        this.initialLoading = false
      }
    },

    async handleServerSearch(value) {
      this.loading = true

      try {
        const response = await this.fetchFn(
          value,
          AUTOCOMPLETE_SERVER_FETCH_SIZE
        )

        this.localOptions = response

        if (!value) {
          await this.fetchNotIncludedTags(response)
        }

        this.loading = false
      } catch (error) {
        console.error(error)
        this.localOptions = []
        this.loading = false
      }
    },

    onVisibleChange(value) {
      if (!this.collapseTags) {
        return
      }

      this.isSelectFocused = value

      // Scroll to the bottom of the list where cursor is focused
      if (value) {
        setTimeout(() => {
          const element = document.querySelector(
            '.autocomplete-many-input .el-select__tags'
          )
          if (element) {
            element.scrollTop = element.scrollHeight
          }
        }, 150)
      }
    },

    onSelectMouseLeave
  }
}
</script>

<style lang="scss">
.autocomplete-many-input {
  .el-input__wrapper {
    height: 40px;
  }

  .el-select__tags {
    top: 6px;
    transform: none;
  }

  &.expand {
    .el-input__wrapper {
      height: 87px;
    }

    .el-select__tags {
      @apply overflow-auto;
      top: 6px;
      height: 80px;
      transform: none;
      align-items: start;
    }
  }

  &.empty {
    .el-input__wrapper {
      height: 40px;
    }

    .el-select__tags {
      height: 40px;
    }
  }
}
</style>
