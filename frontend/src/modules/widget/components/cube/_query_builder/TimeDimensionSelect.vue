<template>
  <div>
    <label
      for="formTimeDimensions"
      class="block text-xs leading-none font-semibold mb-1"
    >Time Dimensions</label>
    <el-select
      id="formTimeDimensions"
      :model-value="
        timeDimensions[0]
          && timeDimensions[0].dimension.name
      "
      clearable
      filterable
      :disabled="computedTimeDimensions.length <= 1"
      class="w-full"
      @change="handleTimeChange"
    >
      <el-option
        v-for="item in translatedOptions(
          computedTimeDimensions,
        )"
        :key="item.value"
        :value="item.value"
        :label="item.label"
        @mouseleave="onSelectMouseLeave"
      />
    </el-select>
  </div>
</template>

<script>
import { i18n } from '@/i18n';
import { onSelectMouseLeave } from '@/utils/select';

export default {
  name: 'TimeDimensionSelect',
  props: {
    measures: {
      type: Array,
      default: () => [],
    },
    timeDimensions: {
      type: Array,
      default: () => [],
    },
    availableTimeDimensions: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['change'],
  data() {
    return {
      measureTimeDimensions: {
        'Activities.count': ['Activities.date'],
        'Activities.cumulativeCount': ['Activities.createdat'],
        'MemberTags.count': ['MemberTags.createdat'],
        'Members.averageTimeToFirstInteraction': ['Members.createdat'],
        'Members.count': [
          'Members.joinedAt',
          'Activities.date',
        ],
        'Members.cumulativeCount': ['Members.createdat'],
        'Conversations.count': ['Conversations.createdat'],
        'Sentiment.averageSentiment': ['Sentiment.date'],
        'Organizations.count': ['Organizations.createdat'],
        'Segments.count': ['Segments.createdat'],
        'Tags.count': ['Tags.createdat'],
      },
    };
  },
  computed: {
    computedTimeDimensions() {
      const measure = this.measures[0];
      return !measure
        ? []
        : this.availableTimeDimensions.filter((t) => !!this.measureTimeDimensions[
          measure.name
        ]?.includes(t.name));
    },
  },
  watch: {
    measures: {
      handler(newVal, oldVal) {
        if (newVal?.[0]?.name !== oldVal?.[0]?.name) {
          this.handleTimeChange(this.computedTimeDimensions[0].name);
        }
      },
    },
  },
  methods: {
    handleTimeChange(value) {
      const [selectedTd = {}] = this.timeDimensions;
      const td = this.availableTimeDimensions.find(
        ({ name }) => name === value,
      );
      if (!td) {
        this.$emit('change', []);
        return;
      }
      this.$emit('change', [
        {
          dimension: td.name,
          granularity: selectedTd.granularity || 'day',
          dateRange: selectedTd.dateRange,
        },
      ]);
    },
    translatedOptions(list) {
      return list.map((i) => ({
        ...i,
        value: i.name,
        label: i18n(`widget.cubejs.${i.name}`),
      }));
    },
    onSelectMouseLeave,
  },
};
</script>
