<template>
  <section v-bind="$attrs">
    <div class="flex items-center justify-between pb-4">
      <h6>
        Organization details
      </h6>
    </div>
    <div>
      <!-- Description -->
      <article v-if="description" class="border-b border-gray-100 flex py-4">
        <div class="w-5/12">
          <p class="text-small font-semibold">
            Description
          </p>
        </div>
        <div class="w-7/12">
          <lf-organization-attribute-string
            :data="description"
          />
        </div>
      </article>

      <!-- Location -->
      <article v-if="location" class="border-b border-gray-100 flex py-4">
        <div class="w-5/12">
          <p class="text-small font-semibold">
            Location
          </p>
        </div>
        <div class="w-7/12">
          <lf-organization-attribute-string
            :data="location"
          />
        </div>
      </article>

      <!-- Enriched attributes -->
      <article
        v-for="attribute in visibleAttributes"
        :key="attribute.name"
        class="border-b border-gray-100 flex py-4"
      >
        <div class="w-5/12">
          <p class="text-small font-semibold mb-1">
            {{ attribute.label }}
          </p>
          <p class="text-tiny text-gray-400">
            Source: <span class="text-purple-500">Enrichment</span>
          </p>
        </div>
        <div class="w-7/12 pr-1">
          <component
            :is="attribute.component"
            v-if="attribute.component"
            :data="getValue(attribute)"
            v-bind="attribute.attributes"
          />
          <lf-organization-attribute-array
            v-else-if="attribute.type === AttributeType.ARRAY"
            :data="getValue(attribute)"
            v-bind="attribute.attributes"
          />
          <lf-organization-attribute-json
            v-else-if="attribute.type === AttributeType.JSON"
            :data="getValue(attribute)"
            v-bind="attribute.attributes"
          />
          <lf-organization-attribute-string
            v-else
            :data="`${getValue(attribute)}`"
          />
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Organization } from '@/modules/organization/types/Organization';
import LfOrganizationAttributeString
  from '@/modules/organization/components/details/overview/attributes/organization-attribute-string.vue';
import enrichmentAttributes, { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment';
import { AttributeType } from '@/modules/organization/types/Attributes';
import LfOrganizationAttributeArray
  from '@/modules/organization/components/details/overview/attributes/organization-attribute-array.vue';
import LfOrganizationAttributeJson
  from '@/modules/organization/components/details/overview/attributes/organization-attribute-json.vue';

const props = defineProps<{
  organization: Organization,
}>();

const description = computed(() => props.organization.description);
const location = computed(() => props.organization.location);

const visibleAttributes = computed(() => enrichmentAttributes
  .filter((a) => ((props.organization[a.name] && a.type !== AttributeType.ARRAY && a.type !== AttributeType.JSON)
          || (a.type === AttributeType.ARRAY && props.organization[a.name]?.length)
          || (a.type === AttributeType.JSON && props.organization[a.name] && Object.keys(props.organization[a.name]))) && a.showInAttributes));

const getValue = (attribute: OrganizationEnrichmentConfig) => {
  const value = props.organization[attribute.name];
  if (attribute.formatValue) {
    return attribute.formatValue(value);
  }
  return value;
};
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsAttributes',
};
</script>
