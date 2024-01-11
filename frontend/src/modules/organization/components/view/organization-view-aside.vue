<template>
  <div class="member-view-aside panel !px-0">
    <div>
      <app-organization-aside-identities
        :organization="organization"
      />

      <div v-if="shouldShowAttributes">
        <el-divider class="!my-8" />

        <div class="mt-10 px-6">
          <div class="font-medium text-black">
            Attributes
          </div>

          <app-organization-aside-enriched
            :organization="organization"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import enrichmentAttributes from '@/modules/organization/config/enrichment';
import { AttributeType } from '@/modules/organization/types/Attributes';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import Plans from '@/security/plans';
import AppOrganizationAsideEnriched from './_aside/_aside-enriched.vue';
import AppOrganizationAsideIdentities from './_aside/_aside-identities.vue';

const props = defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const { currentTenant } = mapGetters('auth');

const shouldShowAttributes = computed(() => {
  if (currentTenant.value.plan === Plans.values.essential) {
    return true;
  }
  return enrichmentAttributes.some((a) => {
    if (a.type === AttributeType.ARRAY) {
      return !!props.organization[a.name]?.length;
    }

    return !!props.organization[a.name];
  });
});
</script>

<script>
export default {
  name: 'AppOrganizationViewAside',
};
</script>
