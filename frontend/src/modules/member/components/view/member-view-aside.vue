<template>
  <div class="flex flex-col gap-6">
    <app-member-aside-enrichment :member="member" @edit="identitiesDrawer = true" />
    <div class="member-view-aside panel">
      <app-member-aside-identities :member="member" @edit="identitiesDrawer = true" />
      <app-lf-member-aside-organizations
        class="mt-10"
        :member="member"
      />
      <app-member-aside-custom-attributes
        :member="member"
        class="mt-10"
      />
      <app-member-aside-enriched
        :member="member"
        class="mt-10"
      />
    </div>
  </div>
  <app-member-manage-identities-drawer
    v-if="identitiesDrawer"
    v-model="identitiesDrawer"
    :member="member"
  />
</template>

<script setup>
import AppMemberManageIdentitiesDrawer from '@/modules/member/components/member-manage-identities-drawer.vue';
import { ref } from 'vue';
import AppMemberAsideEnrichment from '@/modules/member/components/view/_aside/_aside-enrichment.vue';
import AppMemberAsideCustomAttributes from './_aside/_aside-custom-attributes.vue';
import AppMemberAsideIdentities from './_aside/_aside-identities.vue';
import AppMemberAsideEnriched from './_aside/_aside-enriched.vue';
import AppLfMemberAsideOrganizations from './_aside/_aside-organizations.vue';

defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const identitiesDrawer = ref(false);
</script>

<script>
export default {
  name: 'AppMemberViewAside',
};
</script>
