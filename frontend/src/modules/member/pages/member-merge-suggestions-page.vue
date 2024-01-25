<template>
  <app-page-wrapper>
    <app-back-link
      class="mt-1 mb-4"
      :default-route="{
        path: '/contributors',
        query: { projectGroup: selectedProjectGroup?.id },
      }"
    >
      <template #default>
        Contributors
      </template>
    </app-back-link>
    <h4 class="text-xl font-semibold leading-9 mb-1">
      Merging suggestions
    </h4>
    <div class="text-xs text-gray-600 pb-6">
      LFX is constantly checking your community for duplicate contributors.
      Here you can check all the merging suggestions.
    </div>

    <app-member-merge-suggestions :query="route.query" />
  </app-page-wrapper>
</template>

<script setup>
import AppMemberMergeSuggestions from '@/modules/member/components/member-merge-suggestions.vue';
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<script>
export default {
  name: 'AppMemberMergeSuggestionsPage',
};
</script>
