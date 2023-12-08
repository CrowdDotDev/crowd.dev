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
      <cr-enrichment-sneak-peak v-if="organization[attribute.name]" type="contact">
        <template #default="{ enabled }">
          <div>
            <div class="flex items-center">
              <div
                class="text-gray-400 font-medium text-2xs mr-2"
                :class="{ 'text-purple-400': !enabled }"
              >
                {{ attribute.label }}
              </div>
              <el-tooltip content="Source: Enrichment" placement="top" trigger="hover" :disabled="!enabled">
                <app-svg name="source" class="h-3 w-3" />
              </el-tooltip>
            </div>
            <div v-if="!enabled" class="w-full mt-2 h-3 bg-gradient-to-r from-gray-100 to-gray-50" />
            <component
              :is="attribute.component"
              v-else-if="attribute.component && attribute.type === AttributeType.ARRAY"
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
              :value-parser="attribute.valueParser"
              :filter-value="attribute.filterValue"
            />
            <div v-else class="mt-1 text-gray-900 text-xs">
              {{ attribute.displayValue(organization[attribute.name]) }}
            </div>
          </div>
        </template>
      </cr-enrichment-sneak-peak>
    </div>
    <cr-enrichment-sneak-peak-content type="organization" :dark="true" class="mt-3 -mx-2" />
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';
import enrichmentAttributes from '@/modules/organization/config/enrichment';
import { AttributeType } from '@/modules/organization/types/Attributes';
import AppSvg from '@/shared/svg/svg.vue';
import CrEnrichmentSneakPeak from '@/shared/modules/enrichment/components/encirhment-sneak-peak.vue';
import CrEnrichmentSneakPeakContent from '@/shared/modules/enrichment/components/encirhment-sneak-peak-content.vue';

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
