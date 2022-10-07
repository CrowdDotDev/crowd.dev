<template>
  <div class="filter-container">
    <div class="flex items-center justify-between">
      <div class="text-base">
        <span class="font-semibold">Add filters</span>
        (optional)
      </div>
      <span
        class="flex items-center ml-2 hover:opacity-80 text-blue-500 cursor-pointer"
      >
        <i class="flex items-center ri-add-line mr-1"></i
        ><span class="leading-none block" @click="addFilter"
          >Add new</span
        >
      </span>
    </div>
    <div v-if="localFilters.length === 0">
      <span class="text-gray-400 italic font-light"
        >There are no active filters</span
      >
    </div>
    <div v-else class="mt-2">
      <div class="flex -mx-3">
        <div class="px-3 flex-1 grow">
          <label class="block leading-none mb-2"
            >Measure/Dimension</label
          >
        </div>
        <div class="px-3 flex-1 grow">
          <label class="block leading-none mb-2"
            >Condition</label
          >
        </div>
        <div class="px-3 flex-1 grow">
          <label class="block leading-none mb-2"
            >Value</label
          >
        </div>
        <div class="px-3 shrink">
          <span class="w-1 block">&nbsp;</span>
        </div>
      </div>
      <div
        v-for="(filter, index) in localFilters"
        :key="filter.id"
        class="flex -mx-3 -my-2 items-center"
      >
        <div class="px-3 py-2 grow">
          <el-select
            v-model="filter.select"
            clearable
            filterable
            @change="handleFilterChange"
          >
            <el-option
              v-for="item in computedFilters"
              :key="item.value"
              :value="item.value"
              :label="item.label"
            ></el-option>
          </el-select>
        </div>

        <div class="px-3 py-2 grow">
          <el-select
            v-model="filter.operator"
            clearable
            @change="handleFilterChange"
          >
            <el-option
              v-for="actionItem in actionItems"
              :key="actionItem.value"
              :value="actionItem.value"
            >
              {{ actionItem.text }}
            </el-option>
          </el-select>
        </div>

        <div class="px-3 py-2 grow">
          <el-input
            v-model="filter.value"
            type="text"
            @change="handleFilterChange"
          ></el-input>
        </div>
        <div class="px-3 py-2 shrink">
          <el-tooltip
            content="Delete Filter"
            placement="top"
          >
            <button
              class="hover:opacity-80 flex items-center"
              type="button"
              @click.prevent="removeFilter(index)"
            >
              <i class="ri-xl ri-delete-bin-line"></i>
            </button>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { v4 as uuid } from 'uuid'
export default {
  name: 'FilterComponent',
  props: {
    measures: {
      type: Array,
      default: () => []
    },
    dimensions: {
      type: Array,
      default: () => []
    },
    filters: {
      type: Array,
      default: () => []
    },
    availableDimensions: {
      type: Array,
      default: () => []
    },
    setFilters: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      measureDimensionFilters: {
        'Activities.count': {
          noDimension: [
            'Activities.platform',
            'Activities.type'
          ],
          Activities: [
            'Activities.platform',
            'Activities.type',
            'Activities.date'
          ],
          Members: [
            'Members.score',
            'Members.joinedAt',
            'Members.location',
            'Members.organization'
          ],
          Tags: ['Tags.name']
        },
        'Members.count': {
          noDimension: [
            'Members.score',
            'Members.joinedAt',
            'Members.location',
            'Members.organization'
          ],
          Activities: [
            'Activities.platform',
            'Activities.type',
            'Activities.date'
          ],
          Members: [
            'Members.score',
            'Members.location',
            'Members.organization'
          ],
          Tags: ['Tags.name']
        }
      },
      actionItems: [
        {
          text: 'equals',
          value: 'equals'
        },
        {
          text: 'does not equal',
          value: 'notEquals'
        },
        {
          text: 'is set',
          value: 'set'
        },
        {
          text: 'is not set',
          value: 'notSet'
        },
        {
          text: '>',
          value: 'gt'
        },
        {
          text: '>=',
          value: 'gte'
        },
        {
          text: '<',
          value: 'lt'
        },
        {
          text: '<=',
          value: 'lte'
        }
      ],
      localFilters: []
    }
  },
  computed: {
    computedFilters() {
      const measure = this.measures[0]
      const dimension = this.dimensions[0]
        ? this.dimensions[0].name.split('.')[0]
        : 'noDimension'
      return !measure
        ? []
        : this.availableDimensions.filter((d) => {
            return this.measureDimensionFilters[
              measure.name
            ][dimension] === undefined
              ? false
              : this.measureDimensionFilters[measure.name][
                  dimension
                ].includes(d.name)
          })
    }
  },
  created() {
    this.localFilters = this.initFilters() || []
  },
  methods: {
    addFilter() {
      this.localFilters.push({
        id: uuid(),
        select: null,
        operator: null,
        value: null
      })
    },
    removeFilter(index) {
      this.localFilters.splice(index, 1)
      this.syncFilters()
    },
    handleFilterChange() {
      this.syncFilters()
    },
    initFilters() {
      if (!this.filters.length) {
        return []
      }

      return JSON.parse(JSON.stringify(this.filters)).map(
        (f) => {
          const filter = f

          filter.value = f.values[0]
          filter.select = f.member

          delete filter.member
          delete filter.values

          return filter
        }
      )
    },
    syncFilters() {
      const newFilters = this.localFilters
        .filter((filter) => {
          return [
            filter.select,
            filter.operator,
            filter.value
          ].every((value) => value !== '' && value != null)
        })
        .map((filter) => {
          return {
            member: filter.select,
            operator: filter.operator,
            values: [filter.value]
          }
        })

      this.setFilters(newFilters)
    }
  }
}
</script>
