<template>
  <div class="widget-filter-container">
    <div class="flex items-center justify-between">
      <div class="font-semibold text-sm">Filters</div>
    </div>
    <div class="mt-2">
      <div class="flex -mx-2">
        <div class="flex-1 grow h-0">
          <label class="block leading-none mb-2"></label>
        </div>
        <div class="flex-1 grow h-0">
          <label class="block leading-none mb-2"></label>
        </div>
        <div class="flex-1 grow h-0">
          <label class="block leading-none mb-2"></label>
        </div>
        <div class="shrink h-0">
          <span class="w-1 block">&nbsp;</span>
        </div>
      </div>
      <div
        v-for="(filter, index) in localFilters"
        :key="filter.id"
        class="flex -mx-2 mb-2 items-center"
      >
        <div class="flex items-center mx-2">
          <div class="grow">
            <el-select
              v-model="filter.select"
              class="first-filter"
              clearable
              filterable
              placeholder="Measure/dimension"
              @change="
                (value) =>
                  handleFilterChange(
                    'first-option',
                    value,
                    index
                  )
              "
            >
              <el-option
                v-for="item in computedFilters"
                :key="item.value"
                :value="item.value"
                :label="item.label"
                @mouseleave="onSelectMouseLeave"
              ></el-option>
            </el-select>
          </div>

          <div class="grow">
            <el-select
              v-model="filter.operator"
              class="second-filter"
              clearable
              placeholder="Condition"
              @change="
                (value) =>
                  handleFilterChange(
                    'second-option',
                    value,
                    index
                  )
              "
            >
              <el-option
                v-for="actionItem in actionItems"
                :key="actionItem.value"
                :value="actionItem.value"
                @mouseleave="onSelectMouseLeave"
              >
                {{ actionItem.text }}
              </el-option>
            </el-select>
          </div>

          <div class="grow">
            <el-select
              v-if="filter.select === 'Activities.platform'"
              v-model="filter.value"
              class="third-filter"
              placeholder="Value"
              @change="
                (value) =>
                  handleFilterChange(
                    'third-option',
                    value,
                    index
                  )
              "
            >
              <el-option
                v-for="integration of Object.keys(
                  activeIntegrationsList
                )"
                :key="platformDetails(integration).name"
                :label="platformDetails(integration).name"
                :value="integration"
                @mouseleave="onSelectMouseLeave"
              />
            </el-select>
            <el-select
              v-else-if="
                filter.select === 'Activities.type'
              "
              v-model="filter.value"
              class="third-filter"
              placeholder="Value"
              @change="
                (value) =>
                  handleFilterChange(
                    'third-option',
                    value,
                    index
                  )
              "
            >
              <el-option-group
                v-for="group in computedActivityTypes"
                :key="group.label.key"
                :label="group.label.value"
              >
                <el-option
                  v-for="item in group.nestedOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-option-group>
            </el-select>
            <el-input
              v-else
              v-model="filter.value"
              class="third-filter"
              type="text"
              placeholder="Value"
              @change="
                (value) =>
                  handleFilterChange(
                    'third-option',
                    value,
                    index
                  )
              "
            ></el-input>
          </div>
        </div>
        <div class="pr-2 shrink">
          <el-tooltip
            content="Delete Filter"
            placement="top"
          >
            <button
              class="btn btn--transparent btn--md"
              type="button"
              @click.prevent="removeFilter(index)"
            >
              <i class="ri-lg ri-delete-bin-line"></i>
            </button>
          </el-tooltip>
        </div>
      </div>
      <span
        class="flex items-center text-brand-500 hover:text-brand-700 cursor-pointer text-xs font-medium mt-2"
      >
        <i class="flex items-center ri-add-line mr-1"></i
        ><span class="leading-none block" @click="addFilter"
          >Add filter</span
        >
      </span>
    </div>
  </div>
</template>

<script>
import { v4 as uuid } from 'uuid'
import { onSelectMouseLeave } from '@/utils/select'
import { mapGetters, mapActions } from 'vuex'
import { CrowdIntegrations } from '@/integrations/integrations-config'
import { ActivityModel } from '@/modules/activity/activity-model'

const { fields } = ActivityModel

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
    },
    computedActivityTypes() {
      return fields.type
        .dropdownOptions()
        .filter((i) =>
          Object.keys(this.activeIntegrationsList).includes(
            i.label.key
          )
        )
    },
    ...mapGetters({
      activeIntegrationsList: 'integration/activeList'
    }),
    fields() {
      return fields
    }
  },
  async created() {
    await this.doFetchIntegrations()
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
    handleFilterChange(option, value, index) {
      this.syncFilters(option, value, index)
    },
    initFilters() {
      if (!this.filters.length) {
        return []
      }

      return JSON.parse(JSON.stringify(this.filters)).map(
        (f) => {
          const filter = f

          filter.value = f.values[0]
          filter.select = f.member.name

          delete filter.member
          delete filter.values

          return filter
        }
      )
    },
    syncFilters(option, value, index) {
      const hasChangedFirstOption =
        option === 'first-option' &&
        this.filters?.[index]?.select !== value

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

      if (hasChangedFirstOption) {
        this.localFilters[index].value = undefined
      }

      this.setFilters(newFilters)
    },

    onSelectMouseLeave,
    ...mapActions({
      doFetchIntegrations: 'integration/doFetch'
    }),

    platformDetails(platform) {
      return CrowdIntegrations.getConfig(platform)
    }
  }
}
</script>

<style lang="scss">
.widget-filter-container {
  .first-filter .el-input__wrapper {
    @apply rounded-r-none;
  }

  .second-filter .el-input__wrapper {
    @apply rounded-none;
  }

  .third-filter .el-input__wrapper {
    @apply rounded-l-none;
  }
}
</style>
