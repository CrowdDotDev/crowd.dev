<template>
  <app-page-wrapper>
    <router-link
      class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center mt-1 mb-4"
      :to="{ path: '/contacts' }"
    >
      <i class="ri-arrow-left-s-line mr-2" />Contacts
    </router-link>
    <h4 class="text-xl font-semibold leading-9 mb-1">
      Merging suggestions
    </h4>
    <div class="text-xs text-gray-600 pb-6">
      crowd.dev is constantly checking your community for duplicate contacts.
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
