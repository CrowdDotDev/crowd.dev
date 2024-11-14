<template>
  <div class="flex justify-center">
    <div class="pt-16 flex flex-col items-center w-full max-w-100">
      <lf-icon-old name="git-repository-line" :size="64" class="text-gray-300 mb-6" />
      <h6 class="text-center pb-3">
        Add and map GitHub repositories
      </h6>
      <p class="text-center text-small text-gray-500 pb-6">
        Choose which repositories you want to track, and map them with the corresponding project.
      </p>
      <lf-button type="primary-ghost" @click="emit('add')">
        <lf-icon name="plus" type="regular" />
        Add repositories
      </lf-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const emit = defineEmits<{(e: 'add'): void }>();
</script>

<script lang="ts">
export default {
  name: 'LfGithubSettingsEmpty',
};
</script>
