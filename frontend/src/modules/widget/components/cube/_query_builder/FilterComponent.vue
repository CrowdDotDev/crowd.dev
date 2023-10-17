<template>
  <div class="flex items-center justify-between">
    <div class="font-semibold text-sm">
      Filters
    </div>
  </div>
  <div
    v-if="!!computedFilters.length"
    class="widget-filter-container"
  >
    <div class="mt-2">
      <div class="flex -mx-2">
        <div class="flex-1 grow h-0">
          <div class="block leading-none mb-2" />
        </div>
        <div class="flex-1 grow h-0">
          <div class="block leading-none mb-2" />
        </div>
        <div class="flex-1 grow h-0">
          <div class="block leading-none mb-2" />
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
                    index,
                  )
              "
            >
              <el-option
                v-for="item in computedFilters"
                :key="item.value"
                :value="item.value"
                :label="item.label"
                @mouseleave="onSelectMouseLeave"
              />
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
                    index,
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
                    index,
                  )
              "
            >
              <el-option
                v-for="integration of Object.keys(
                  activeIntegrationsList,
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
                    index,
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
            <el-select
              v-else-if="filter.select === 'Members.score'"
              v-model="filter.value"
              class="third-filter"
              placeholder="Value"
              @change="
                (value) =>
                  handleFilterChange(
                    'third-option',
                    value,
                    index,
                  )
              "
            >
              <el-option
                v-for="engagementLevel of computedEngagementLevelTypes"
                :key="engagementLevel.label"
                :label="engagementLevel.label"
                :value="engagementLevel.label"
                @mouseleave="onSelectMouseLeave"
              />
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
                    index,
                  )
              "
            />
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
              <i class="ri-lg ri-delete-bin-line" />
            </button>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
  <el-tooltip
    :disabled="!!computedFilters.length"
    placement="top-start"
    content="There are no available filters for the selected measure"
  >
    <span
      class="w-fit flex"
      :class="{
        'mt-4': !computedFilters.length,
        'mt-2': computedFilters.length,
      }"
    >
      <span
        class="flex items-center hover:text-brand-700 text-xs font-medium"
        :class="{
          'pointer-events-none text-gray-300':
            !computedFilters.length,
          'cursor-pointer text-brand-500':
            computedFilters.length,
        }"
      >
        <i class="flex items-center ri-add-line mr-1" /><span
          class="leading-none block"
          @click="addFilter"
        >Add filter</span>
      </span>
    </span>
  </el-tooltip>
</template>

<script>
import { v4 as uuid } from 'uuid';
import { mapGetters, mapActions } from 'vuex';
import { onSelectMouseLeave } from '@/utils/select';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { ActivityModel } from '@/modules/activity/activity-model';
import { MemberModel } from '@/modules/member/member-model';
import isEqual from 'lodash/isEqual';

const { fields: activityFields } = ActivityModel;
const { fields: memberFields } = MemberModel;

export default {
  name: 'FilterComponent',
  props: {
    measures: {
      type: Array,
      default: () => [],
    },
    dimensions: {
      type: Array,
      default: () => [],
    },
    filters: {
      type: Array,
      default: () => [],
    },
    availableDimensions: {
      type: Array,
      default: () => [],
    },
    setFilters: {
      type: Function,
      default: () => {},
    },
  },
  data() {
    return {
      measureDimensionFilters: {
        'Activities.count': {
          noDimension: [
            'Activities.platform',
            'Activities.type',
          ],
          Activities: [
            'Activities.platform',
            'Activities.type',
            'Activities.date',
          ],
          Members: [
            'Members.score',
            'Members.joinedAt',
            'Members.location',
            'Members.organization',
          ],
          Tags: ['Tags.name'],
        },
        'Activities.cumulativeCount': {
          noDimension: [
            'Activities.platform',
            'Activities.type',
          ],
          Activities: [
            'Activities.platform',
            'Activities.type',
            'Activities.date',
          ],
          Members: [
            'Members.score',
            'Members.joinedAt',
            'Members.location',
            'Members.organization',
          ],
          Tags: ['Tags.name'],
        },
        'Members.count': {
          noDimension: [
            'Members.score',
            'Members.joinedAt',
            'Members.location',
            'Members.organization',
          ],
          Activities: [
            'Activities.platform',
            'Activities.type',
            'Activities.date',
          ],
          Members: [
            'Members.score',
            'Members.location',
            'Members.organization',
          ],
          Tags: ['Tags.name'],
        },
        'Members.cumulativeCount': {
          noDimension: [
            'Members.score',
            'Members.joinedAt',
            'Members.location',
            'Members.organization',
          ],
          Activities: [
            'Activities.platform',
            'Activities.type',
            'Activities.date',
          ],
          Members: [
            'Members.score',
            'Members.location',
            'Members.organization',
          ],
          Tags: ['Tags.name'],
        },
      },
      actionItems: [
        {
          text: 'equals',
          value: 'equals',
        },
        {
          text: 'does not equal',
          value: 'notEquals',
        },
        {
          text: 'is set',
          value: 'set',
        },
        {
          text: 'is not set',
          value: 'notSet',
        },
        {
          text: '>',
          value: 'gt',
        },
        {
          text: '>=',
          value: 'gte',
        },
        {
          text: '<',
          value: 'lt',
        },
        {
          text: '<=',
          value: 'lte',
        },
      ],
      localFilters: [],
      defaultFilters: [],
    };
  },
  computed: {
    computedFilters() {
      const measure = this.measures[0];
      const dimension = this.dimensions[0]
        ? this.dimensions[0].name.split('.')[0]
        : 'noDimension';

      if (!measure) {
        return [];
      }

      return this.availableDimensions.filter((d) => {
        if (this.measureDimensionFilters[
          measure.name
        ]?.[dimension] === undefined) {
          return false;
        }

        return this.measureDimensionFilters[measure.name][
          dimension
        ].includes(d.name);
      });
    },
    computedActivityTypes() {
      return activityFields.type
        .dropdownOptions()
        .filter((i) => Object.keys(this.activeIntegrationsList).includes(
          i.label.key,
        ));
    },
    computedEngagementLevelTypes() {
      return memberFields.engagementLevel.dropdownOptions();
    },
    ...mapGetters({
      activeIntegrationsList: 'integration/activeList',
    }),
  },
  watch: {
    measures: {
      // Clear filters if measure changes
      handler(updatedMeasures, previousMeasures) {
        if (updatedMeasures[0].name !== previousMeasures[0].name) {
          this.localFilters = [];
          this.syncFilters();
        }
      },
    },
  },
  async created() {
    await this.doFetchIntegrations();
    this.localFilters = this.initFilters() || [];
  },
  methods: {
    addFilter() {
      this.localFilters.push({
        id: uuid(),
        select: null,
        operator: null,
        value: null,
      });
    },
    removeFilter(index) {
      this.localFilters.splice(index, 1);
      this.syncFilters();
    },
    handleFilterChange(option, value, index) {
      this.syncFilters(option, value, index);
    },
    initFilters() {
      if (!this.filters.length) {
        return [];
      }

      return (
        JSON.parse(JSON.stringify(this.filters))
          .map((f) => {
            const filter = f;
            const { values } = filter;

            if (filter.member.name === 'Members.score') {
              const parsedValues = values.map((v) => Number(v));
              const engagement = this.computedEngagementLevelTypes.find((t) => isEqual(t.value, parsedValues))?.label;

              filter.value = engagement;
            } else {
              [filter.value] = values;
            }

            filter.select = f.member.name;

            delete filter.member;
            delete filter.values;

            return filter;
          })
          // Remove default filters from options for now
          .filter(
            (f) => {
              if (f.select !== 'Members.isTeamMember' && f.select !== 'Members.isBot') {
                return true;
              }

              this.defaultFilters.push({
                member: f.select,
                operator: f.operator,
                values: [f.value],
              });
              return false;
            },
          )
      );
    },
    syncFilters(option, value, index) {
      const hasChangedFirstOption = option === 'first-option'
        && this.filters?.[index]?.select !== value;

      const newFilters = this.localFilters
        .filter((filter) => [
          filter.select,
          filter.operator,
          filter.value,
        ].every((v) => v !== '' && v != null))
        .map((filter) => {
          let values = [filter.value];

          // Members engagement level needs to be parsed differently
          if (filter.select === 'Members.score') {
            values = this.computedEngagementLevelTypes
              .filter((t) => t.label === filter.value)?.[0]
              .value.map((v) => `${v}`);
          }

          return {
            member: filter.select,
            operator: filter.operator,
            values,
          };
        });

      if (hasChangedFirstOption) {
        this.localFilters[index].value = undefined;
      }

      const filters = newFilters.concat(this.defaultFilters);

      this.setFilters(filters);
    },

    onSelectMouseLeave,
    ...mapActions({
      doFetchIntegrations: 'integration/doFetch',
    }),

    platformDetails(platform) {
      return CrowdIntegrations.getConfig(platform);
    },
  },
};
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
