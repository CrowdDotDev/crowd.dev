<template>
  <section>
    <lf-card class="!bg-gradient-to-b from-primary-25 to-white px-5 pt-5 pb-6">
      <h6 class="text-h6 mb-4">
        Community snapshot
      </h6>
      <div class="flex -mx-4">
        <article class="px-4 h-full w-1/4">
          <p class="text-tiny text-secondary-300 mb-2">
            Engagement level
          </p>
        </article>
        <article class="px-4 h-full w-1/4 border-l border-gray-200">
          <p class="text-tiny text-secondary-300 mb-2">
            Avg. sentiment
          </p>
        </article>
        <article class="px-4 h-full w-1/4 border-l border-gray-200">
          <p class="text-tiny text-secondary-300 mb-2">
            # of activities
          </p>
          <p class="text-small">
            2000
          </p>
        </article>
        <article class="px-4 h-full w-1/4 border-l border-gray-200">
          <p class="text-tiny text-secondary-300 mb-2">
            Joined date
          </p>
          <p class="text-small">
            July 10, 2022
          </p>
        </article>
      </div>
    </lf-card>
  </section>
</template>

<script setup lang="ts">

import LfCard from '@/ui-kit/card/Card.vue';
</script>
<script lang="ts">
export default {
  name: 'LfContributorDetailsCommunity',
};
</script>
