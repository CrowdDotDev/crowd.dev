<template>
  <app-page-wrapper size="narrow">
    <app-back-link
      class="mt-1 mb-4"
      :default-route="{ path: '/organizations' }"
    >
      <template #default>
        Organizations
      </template>
    </app-back-link>
    <h4 class="text-xl font-semibold leading-9 mb-1">
      Merging suggestions
    </h4>
    <div class="text-xs text-gray-600 pb-6">
      crowd.dev is constantly checking your community for duplicate organizations.
      Here you can check all the merging suggestions.
    </div>

    <app-organization-merge-suggestions :query="route.query" />
  </app-page-wrapper>
</template>

<script setup>
import { useRoute } from 'vue-router';
import AppOrganizationMergeSuggestions from '@/modules/organization/components/organization-merge-suggestions.vue';

const route = useRoute();
</script>

<script>
export default {
  name: 'AppOrganizationMergeSuggestionsPage',
};
</script>
