<template>
  <el-tooltip
    content="Please select a measure first"
    placement="top"
    :disabled="measures.length > 0"
  >
    <div class="w-full">
      <label
        class="block text-xs leading-none font-semibold mb-1"
        >Dimensions</label
      >
      <el-select
        v-model="value"
        clearable
        filterable
        :disabled="measures.length === 0"
        class="w-full"
        @mouseleave="onSelectMouseLeave"
      >
        <el-option
          v-for="item in translatedOptions(
            computedDimensions
          )"
          :key="item.value"
          :value="item.value"
          :label="item.label"
        ></el-option>
      </el-select>
    </div>
  </el-tooltip>
</template>

<script>
import { onSelectMouseLeave } from '@/utils/select'

export default {
  name: 'DimensionSelect',
  props: {
    measures: {
      type: Array,
      default: () => []
    },
    dimensions: {
      type: Array,
      default: () => []
    },
    availableDimensions: {
      type: Array,
      default: () => []
    },
    setDimensions: {
      type: Function,
      default: () => {}
    },
    translatedOptions: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      measureDimensions: {
        'Activities.count': [
          'Activities.platform',
          'Activities.type',
          'Activities.date',
          'Members.score',
          'Members.location',
          'Members.joinedAt',
          'Members.organization',
          'Tags.name'
        ],
        'Members.count': [
          'Activities.platform',
          'Activities.type',
          'Activities.date',
          'Members.score',
          'Members.location',
          'Members.joinedAt',
          'Members.organization',
          'Tags.name'
        ],
        'Conversations.count': [
          'Activities.platform',
          'Activities.type',
          'Activities.date',
          'Conversations.createdat',
          'Conversations.platform',
          'Conversations.category',
          'Conversations.published',
          'Conversations.lastactive',
          'Members.score',
          'Members.location',
          'Members.joinedAt',
          'Members.organization',
          'Tags.name'
        ]
      }
    }
  },
  computed: {
    computedDimensions() {
      const measure = this.measures[0]
      return !measure
        ? []
        : this.availableDimensions.filter((t) => {
            return !!this.measureDimensions[
              measure.name
            ]?.includes(t.name)
          })
    },
    value: {
      get() {
        return this.translatedOptions(this.dimensions).map(
          (i) => i.label
        )
      },
      set(value) {
        return this.setDimensions([value])
      }
    }
  },

  methods: {
    onSelectMouseLeave
  }
}
</script>
