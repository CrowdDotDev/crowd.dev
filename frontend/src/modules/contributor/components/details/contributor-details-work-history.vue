<template>
  <section>
    <div class="flex justify-between items-center pb-6">
      <h6 class="text-h6">
        Work history
      </h6>
      <lf-button type="secondary" size="small" :icon-only="true">
        <lf-icon name="add-fill" />
      </lf-button>
    </div>

    <div class="flex flex-col gap-4 pb-6">
      <article>
        <div class="flex">
          <lf-avatar name="Google" :size="24" class="!rounded-md border border-gray-200" />
          <div class="flex-grow pl-3">
            <p class="font-semibold text-medium leading-6 mb-1">
              Google LLC
            </p>
            <p class="text-small text-gray-500 mb-1.5">
              Senior Software Engineer
            </p>
            <p class="text-small text-gray-500">
              August 2024 → Present
            </p>
          </div>
        </div>
      </article>
    </div>

    <lf-button type="primary-link" size="medium">
      Show more
    </lf-button>
  </section>
</template>

<script setup lang="ts">
import LfButton from '@/ui-kit/button/Button.vue';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';

const props = defineProps<{
  contributor: Contributor,
}>();
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsWorkHistory',
};
</script>
