<template>
  <div class="px-2">
    <div class="py-2">
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
      <vue-draggable-next :list="list">
        <article
          v-for="view of list"
          :key="view.id"
          class="p-2 rounded flex items-center justify-between flex-grow transition hover:bg-gray-50 cursor-grab"
        >
          <div class="flex items-center">
            <i class="ri-draggable text-base text-gray-400 mr-2" />
            <span class="text-sm leading-5 text-black">{{ view.label }}</span>
          </div>
          <div class="flex items-center">
            <div
              class="h-6 w-6 flex items-center justify-center ml-1 group cursor-pointer"
              @click="edit(view.id)"
            >
              <i class="ri-pencil-line text-sm text-gray-400 group-hover:text-gray-600" />
            </div>
            <div
              class="h-6 w-6 flex items-center justify-center ml-1 group cursor-pointer"
              @click="duplicate(view.id)"
            >
              <i class="ri-file-copy-line text-sm text-gray-400 group-hover:text-gray-600" />
            </div>
            <div
              class="h-6 w-6 flex items-center justify-center ml-1 group cursor-pointer"
              @click="remove(view.id)"
            >
              <i class="ri-delete-bin-line text-sm text-gray-400 group-hover:text-gray-600" />
            </div>
          </div>
        </article>
      </vue-draggable-next>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SavedView, SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { VueDraggableNext } from 'vue-draggable-next';
import { ref } from 'vue';

const props = defineProps<{
  config: SavedViewsConfig,
  views: SavedView[]
}>();

const list = ref([
  {
    id: 1,
    label: 'New and active',
  },
  {
    id: 2,
    label: 'Slipping away',
  },
  {
    id: 3,
    label: 'Most engaged',
  },
]);

const edit = (id: string) => {
  console.log('edit', id);
};
const remove = (id: string) => {
  console.log('delete', id);
};
const duplicate = (id: string) => {
  console.log('duplicate', id);
};
</script>

<script lang="ts">
export default {
  name: 'CrSavedViewsManagement',
};
</script>

<style lang="scss">

</style>
