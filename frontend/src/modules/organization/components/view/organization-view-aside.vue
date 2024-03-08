<template>
  <div class="member-view-aside panel !px-0">
    <app-organization-aside-identities
      :organization="organization"
      @unmerge="emit('unmerge', $event)"
    />
  </div>

  <div v-if="shouldShowAttributes" class="member-view-aside panel !px-0 mt-6">
    <div class="px-6">
      <div class="font-medium text-black">
        Attributes
      </div>

      <app-organization-aside-enriched
        :organization="organization"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import enrichmentAttributes from '@/modules/organization/config/enrichment';
import { AttributeType } from '@/modules/organization/types/Attributes';
import Plans from '@/security/plans';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import AppOrganizationAsideEnriched from './_aside/_aside-enriched.vue';
import AppOrganizationAsideIdentities from './_aside/_aside-identities.vue';

const props = defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const emit = defineEmits(['unmerge']);

const authStore = useAuthStore();
const { tenant } = storeToRefs(authStore);

const shouldShowAttributes = computed(() => {
  if (tenant.value.plan === Plans.values.essential) {
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
