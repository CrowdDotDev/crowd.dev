<template>
  <div class="flex flex-col gap-6">
    <!-- Member enrichment -->
    <app-member-enrichment
      v-if="!member.lastEnriched"
      :member="member"
    />

    <div class="member-view-aside panel !px-0">
      <app-member-aside-identities :member="member" />

      <el-divider class="!my-8 border-gray-200" />

      <div class="px-6">
        <app-lf-member-aside-organizations
          class="mt-10"
          :member="member"
        />
      </div>

      <el-divider class="!my-8 border-gray-200" />

      <div class="px-6">
        <app-member-aside-custom-attributes
          :member="member"
        />
      </div>

      <div class="px-6">
        <app-member-aside-enriched
          :member="member"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import AppMemberEnrichment from '@/modules/member/components/member-enrichment.vue';
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
</script>

<script>
export default {
  name: 'AppMemberViewAside',
};
</script>
