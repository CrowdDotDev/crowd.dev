<template>
  <div class="flex flex-col gap-6">
    <app-member-aside-enrichment :member="member" @edit="identitiesDrawer = true" />
    <div class="member-view-aside panel !px-0">
      <app-member-aside-identities :member="member" @edit="identitiesDrawer = true" />

      <el-divider class="!my-8 border-gray-200" />

      <div class="px-6">
        <app-lf-member-aside-organizations
          class="mt-10"
          :member="member"
        />
      </div>

      <el-divider class="!my-8 border-gray-200" />

      <div class="px-6">
        <app-lf-member-aside-sub-projects
          class="mt-10"
          :member="member"
        />
      </div>
    </div>

    <div class="member-view-aside panel">
      <app-member-aside-custom-attributes
        :member="member"
      />
      <app-member-aside-enriched
        :member="member"
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
import AppLfMemberAsideSubProjects from '@/modules/lf/member/components/view/lf-member-aside-sub-projects.vue';
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
