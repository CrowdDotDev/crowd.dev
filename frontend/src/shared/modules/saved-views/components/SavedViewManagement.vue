<template>
  <div class="p-8">
    <article class="py-2.5 px-3 flex justify-between">
      <p class="text-xs text-gray-900">
        {{ props.config.defaultView.label }}
      </p>
      <p class="text-xs text-gray-400 italic">
        default view
      </p>
    </article>
  </div>
  <div class="border-b border-gray-100" />
  <div class="py-2">

  </div>
</template>

<script setup lang="ts">
import { SavedView, SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const props = defineProps<{
  config: SavedViewsConfig,
  views: SavedView[]
}>();
</script>

<script lang="ts">
export default {
  name: 'CrSavedViewsManagement',
};
</script>

<style lang="scss">

</style>
