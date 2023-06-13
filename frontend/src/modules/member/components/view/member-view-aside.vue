<template>
  <div class="flex flex-col gap-6">
    <!-- Member enrichment -->
    <app-member-enrichment
      v-if="!member.lastEnriched"
      :member="member"
    />

    <div class="member-view-aside panel">
      <app-member-aside-identities :member="member" />
      <app-member-aside-organizations
        class="mt-10"
        :member="member"
      />
      <app-member-aside-sub-projects
        class="mt-10"
        :member="member"
      />
    </div>

    <div class="member-view-aside panel">
      <app-member-aside-custom-attributes
        :member="member"
      />
      <app-member-aside-enriched
        :member="member"
        class="mt-10"
      />
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import AppMemberEnrichment from '@/modules/member/components/member-enrichment.vue';
import AppMemberAsideCustomAttributes from './_aside/_aside-custom-attributes.vue';
import AppMemberAsideIdentities from './_aside/_aside-identities.vue';
import AppMemberAsideEnriched from './_aside/_aside-enriched.vue';
import AppMemberAsideOrganizations from './_aside/_aside-organizations.vue';
import AppMemberAsideSubProjects from './_aside/_aside-sub-projects.vue';

defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});
</script>

<script>
export default {
  name: 'AppMemberViewAside',
};
</script>
