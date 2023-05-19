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
      <div v-if="organization[attribute.name]">
        <div
          class="text-gray-400 font-medium text-2xs"
        >
          {{ attribute.label }}
        </div>

        <div class="mt-1 text-gray-900 text-xs">
          <span v-if="attribute.type === attributesTypes.date">
            {{
              formatDate({
                timestamp: organization[attribute.name],
                subtractDays: null,
                subtractMonths: null,
                format: 'D MMMM, YYYY',
              })
            }}
          </span>
          <div v-else-if="attribute.type === attributesTypes.multiSelect" class="flex flex-wrap gap-1">
            <app-tags
              :tags="organization[attribute.name]"
              :interactive="attribute.isUrl"
              :collapse-tags="true"
              :collapse-tags-tooltip="true"
              :tag-tooltip-content="true"
            >
              <template v-if="attribute.isUrl" #tagTooltipContent>
                <span>Open profile
                  <i
                    class="ri-external-link-line text-gray-400"
                  /></span>
              </template>
            </app-tags>
          </div>
          <span v-else>
            {{ attribute.type === attributesTypes.string ? toSentenceCase(organization[attribute.name]) : organization[attribute.name] }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';
import enrichmentAttributes, { attributesTypes } from '@/modules/organization/config/organization-enrichment-attributes';
import { formatDate } from '@/utils/date';
import { toSentenceCase } from '@/utils/string';
import AppTags from '@/shared/tags/tags.vue';

const props = defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const visibleAttributes = computed(() => enrichmentAttributes.filter((a) => props.organization[a.name] && a.showInAttributes));
</script>
