<template>
  <el-tooltip
    content="Please select a measure first"
    placement="top"
    :disabled="measures.length > 0"
  >
    <div class="w-full">
      <label
        for="dimensions"
        class="block text-xs leading-none font-semibold mb-1"
      >Dimensions</label>
      <el-select
        id="dimensions"
        v-model="value"
        clearable
        filterable
        :disabled="computedDimensions.length <= 1"
        class="w-full"
        @mouseleave="onSelectMouseLeave"
      >
        <el-option
          v-for="item in translatedOptions(
            computedDimensions,
          )"
          :key="item.value"
          :value="item.value"
          :label="item.label"
        />
      </el-select>
    </div>
  </el-tooltip>
</template>

<script>
import { onSelectMouseLeave } from '@/utils/select';

export default {
  name: 'DimensionSelect',
  props: {
    measures: {
      type: Array,
      default: () => [],
    },
    dimensions: {
      type: Array,
      default: () => [],
    },
    availableDimensions: {
      type: Array,
      default: () => [],
    },
    setDimensions: {
      type: Function,
      default: () => {},
    },
    translatedOptions: {
      type: Function,
      default: () => {},
    },
  },
  data() {
    return {
      measureDimensions: {
        'Activities.count': [
          'Activities.platform',
          'Activities.type',
          'Activities.date',
          'Activities.channel',
          'Members.score',
          'Members.location',
          'Members.joinedAt',
          'Members.organization',
          'Segments.name',
          'Tags.name',
        ],
        'Members.count': [
          'Activities.platform',
          'Activities.type',
          'Activities.date',
          'Activities.channel',
          'Members.score',
          'Members.location',
          'Members.joinedAt',
          'Members.organization',
          'Segments.name',
          'Tags.name',
        ],
        'Conversations.count': [
          'Activities.platform',
          'Activities.type',
          'Activities.date',
          'Activities.channel',
          'Conversations.createdat',
          'Conversations.platform',
          'Conversations.category',
          'Conversations.published',
          'Conversations.lastactive',
          'Members.score',
          'Members.location',
          'Members.joinedAt',
          'Members.organization',
          'Segments.name',
          'Tags.name',
        ],
        'Sentiment.averageSentiment': ['Sentiment.platform'],
      },
    };
  },
  computed: {
    computedDimensions() {
      const measure = this.measures[0];
      return !measure
        ? []
        : this.availableDimensions.filter((t) => !!this.measureDimensions[
          measure.name
        ]?.includes(t.name));
    },
    value: {
      get() {
        const measure = this.measures[0];

        // Select first option by default if measure changes
        if (measure) {
          const hasOption = this.measureDimensions[
            measure.name
          ]?.includes(this.dimensions?.[0]?.name);

          if (
            !hasOption
            && this.measureDimensions[measure.name]?.[0]
          ) {
            this.setDimensions([
              this.measureDimensions[measure.name][0],
            ]);
          }
        }

        return this.translatedOptions(this.dimensions).map(
          (i) => i.name,
        )?.[0];
      },
      set(value) {
        return this.setDimensions([value]);
      },
    },
  },

  methods: {
    onSelectMouseLeave,
  },
};
</script>
