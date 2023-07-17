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
            computedDimensions, 'No dimension',
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
        'Activities.cumulativeCount': [
          'Activities.platform',
          'Activities.type',
          'Activities.date',
          'Activities.channel',
          'Members.score',
          'Members.location',
          'Members.joinedAt',
          'Members.organization',
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
          'Tags.name',
        ],
        'Members.cumulativeCount': [
          'Activities.platform',
          'Activities.type',
          'Activities.date',
          'Activities.channel',
          'Members.score',
          'Members.location',
          'Members.joinedAt',
          'Members.organization',
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
          'Tags.name',
        ],
        'Sentiment.averageSentiment': ['Sentiment.platform'],
        'Organizations.count': [
          'Activities.platform',
          'Activities.type',
          'Activities.date',
          'Activities.channel',
          'Members.score',
          'Members.location',
          'Members.joinedAt',
          'Members.organization',
          'Organizations.createdat',
          'Tags.name',
        ],
        'MemberTags.count': [],
        'Tags.count': [],
      },
    };
  },
  computed: {
    computedDimensions() {
      const measure = this.measures?.[0];

      if (!measure) {
        return [];
      }

      const isCumulative = measure.name.includes('cumulative');

      const parsedDimensions = this.availableDimensions.filter((t) => !!this.measureDimensions[
        measure.name
      ]?.includes(t.name));

      if (isCumulative) {
        return [{}].concat(parsedDimensions);
      }

      return parsedDimensions;
    },
    value: {
      get() {
        return this.translatedOptions(this.dimensions, 'No dimension').map(
          (i) => i.name,
        )?.[0];
      },
      set(value) {
        return this.setDimensions([value]);
      },
    },
  },

  watch: {
    measures: {
      // Select first option by default if measure changes
      handler(updatedMeasures, previousMeasures) {
        if (updatedMeasures?.[0].name !== previousMeasures?.[0].name) {
          if (
            this.computedDimensions?.[0]
          ) {
            this.setDimensions([
              this.computedDimensions[0].name,
            ]);
          } else {
            this.setDimensions([]);
          }
        }
      },
    },
  },

  methods: {
    onSelectMouseLeave,
  },
};
</script>
