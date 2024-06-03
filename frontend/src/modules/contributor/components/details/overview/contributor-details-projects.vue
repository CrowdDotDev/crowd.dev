<template>
  <lf-card>
    <div class="p-5">
      <h6>Projects</h6>
    </div>
    <div>
      <article v-for="i in 3" :key="i" class="border-b border-gray-100 px-5 py-4.5 flex items-center justify-between">
        <div class="flex items-center">
          <lf-icon name="stack-line" :size="20" />
          <p class="pl-2 text-medium font-semibold">
            Open Review Initiative
          </p>
        </div>
        <div class="flex items-center">
          <p class="text-small text-gray-500">
            100 activities ・
          </p>
          <lf-button type="primary-link" size="small">
            View activity
          </lf-button>
        </div>
      </article>
    </div>
    <div class="px-5 py-4">
      <lf-button type="primary-link" size="small">
        Show more
      </lf-button>
    </div>
  </lf-card>
</template>

<script setup lang="ts">

import LfCard from '@/ui-kit/card/Card.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsProjects',
};
</script>
