<template>
  <div>
    <div
      v-for="attribute in visibleAttributes"
      :key="attribute.name"
      class="last:border-0"
      :class="{
        'py-3 border-b border-gray-200': organization[attribute.name],
      }"
    >
      <div
        v-if="organization[attribute.name]"
      >
        <div
          class="text-gray-400 font-medium text-2xs"
        >
          {{ attribute.label }}
        </div>

        <component
          :is="attribute.component"
          v-if="attribute.component && attribute.type === AttributeType.ARRAY"
          more-label=""
          wrapper-class="flex flex-wrap -mx-1 mt-2 -mb-1"
          item-class="border border-gray-200 px-1.5 text-xs rounded-md h-fit text-gray-900 m-1 inline-flex break-keep"
          :title="attribute.label"
          :value="organization[attribute.name]"
          :slice-size="3"
          :with-separators="false"
          :is-link="attribute.isLink"
        />
        <component
          :is="attribute.component"
          v-else-if="attribute.component && attribute.type === AttributeType.JSON"
          :attribute-value="organization[attribute.name]"
          :key-parser="attribute.keyParser"
          :nested-key-parser="attribute.nestedKeyParser"
          :value-parser="attribute.valueParser"
          :filter-value="attribute.filterValue"
        />
        <div v-else class="mt-1 text-gray-900 text-xs">
          {{ attribute.displayValue(config[attribute.name]) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';
import enrichmentAttributes from '@/modules/organization/config/enrichment';
import { AttributeType } from '@/modules/organization/types/Attributes';

const props = defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const visibleAttributes = computed(() => enrichmentAttributes
  .filter((a) => ((props.organization[a.name] && a.type !== AttributeType.ARRAY && a.type !== AttributeType.JSON)
    || (a.type === AttributeType.ARRAY && props.organization[a.name]?.length)
    || (a.type === AttributeType.JSON && props.organization[a.name] && Object.keys(props.organization[a.name]))) && a.showInAttributes));
</script>
