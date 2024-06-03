<template>
  <section>
    <div class="flex items-center justify-between pb-8">
      <h6>
        Contributor details
      </h6>
      <lf-button type="secondary" size="small">
        <lf-icon name="add-fill" />
        Add attribute
      </lf-button>
    </div>
    <div>
      <article v-for="i of 2" class="border-b border-gray-100 flex pt-2 pb-3">
        <div class="w-5/12">
          <lf-icon name="file-list-2-line" :size="16" class="mr-1 text-gray-400" />
          <span class="text-gray-500 text-medium">Biography</span>
        </div>
        <div class="w-7/12">
          <p class="text-medium">
            Adipisci quidem iure unde modi iure qui quibusdam quos distinctio perferendis officia. Maiores doloribus quaerat nam similique. Doloribus eaque magni omnis mollitia quam sed dolorem occaecati eos.
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">

import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsAttributes',
};
</script>
