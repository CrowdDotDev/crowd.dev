<template>
  <div class="px-2">
    <div class="py-2">
      <article class="py-2.5 px-3 flex justify-between">
        <p class="text-xs text-gray-900">
          {{ props.config.defaultView.name }}
        </p>
        <p class="text-xs text-gray-400 italic">
          default view
        </p>
      </article>
    </div>
    <div class="border-b border-gray-100" />
    <div class="py-2">
      <vue-draggable-next :list="views" @change="onListChange">
        <article
          v-for="view of views"
          :key="view.id"
          class="p-2 rounded flex items-center justify-between flex-grow transition hover:bg-gray-50 cursor-grab"
        >
          <div class="flex items-center">
            <i class="ri-draggable text-base text-gray-400 mr-2" />
            <span class="text-sm leading-5 text-black">{{ view.name }}</span>
          </div>
          <div class="flex items-center">
            <div
              class="h-6 w-6 flex items-center justify-center ml-1 group cursor-pointer"
              @click="edit(view)"
            >
              <i class="ri-pencil-line text-sm text-gray-400 group-hover:text-gray-600" />
            </div>
            <div
              class="h-6 w-6 flex items-center justify-center ml-1 group cursor-pointer"
              @click="duplicate(view)"
            >
              <i class="ri-file-copy-line text-sm text-gray-400 group-hover:text-gray-600" />
            </div>
            <div
              class="h-6 w-6 flex items-center justify-center ml-1 group cursor-pointer"
              @click="remove(view)"
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
import { SavedView, SavedViewCreate, SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { VueDraggableNext } from 'vue-draggable-next';
import { computed, ref } from 'vue';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { SavedViewsService } from '@/shared/modules/saved-views/services/saved-views.service';
import Message from '@/shared/message/message';

const props = defineProps<{
  config: SavedViewsConfig,
  views: SavedView[]
}>();

const emit = defineEmits<{(e: 'update:views', value: SavedView[]): any,
  (e: 'edit', value: SavedView): any,
  (e: 'duplicate', value: SavedView): any,
  (e: 'reload'): any,
}>();

const views = computed<SavedView[]>({
  get() {
    return props.views;
  },
  set(value: SavedView[]) {
    emit('update:views', value);
  },
});

const onListChange = () => {
  SavedViewsService.updateBulk(
    views.value.map(
      (view, viewIndex) => ({
        id: view.id,
        name: view.name,
        order: viewIndex + 1,
      }),
    ),
  ).then(() => {
    emit('reload');
  })
};

const edit = (view: SavedView) => {
  emit('edit', view);
};
const duplicate = (view: SavedView) => {
  emit('duplicate', view);
};
const remove = (view: SavedView) => {
  const isShared = view.visibility === 'tenant';
  ConfirmDialog({
    type: 'danger',
    title: isShared ? 'Delete shared view' : 'Delete view',
    message: isShared
      ? 'This view will be deleted on all user accounts from this workspace. Are you sure you want to proceed? You can’t undo this action.'
      : 'Are you sure you want to proceed? You can’t undo this action.',
    icon: 'ri-delete-bin-line',
    cancelButtonText: 'Cancel',
    confirmButtonText: isShared ? 'Delete shared view' : 'Delete view',
  } as any)
    .then(() => {
      SavedViewsService.delete(view.id)
        .then(() => {
          emit('reload');
          Message.success('View successfully deleted');
        })
        .catch(() => {
          Message.error('There was an error deleting view');
        });
    });
};
</script>

<script lang="ts">
export default {
  name: 'CrSavedViewsManagement',
};
</script>

<style lang="scss">

</style>
