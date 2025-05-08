<template>
  <div>
    <div
      v-if="collections.length > 0 || search.length > 0"
      class="flex gap-4 pt-6 pb-4"
    >
      <!-- Search input -->
      <lf-search
        v-model="search"
        class="h-9 flex-grow"
        :lazy="true"
        placeholder="Search collections..."
        @update:model-value="searchCollections()"
      />
      <lf-button
        size="medium"
        type="secondary-ghost"
        @click="openCollectionAdd"
      >
        <lf-icon name="rectangle-history-circle-plus" :size="16" />
        Add collection
      </lf-button>
    </div>
    <div v-if="collections.length > 0">
      <lf-collection-table
        :collections="collections"
        @on-edit-collection="onEditCollection($event)"
        @on-star-collection="ontoggleStar($event)"
        @on-delete-collection="openRemoveCollectionDialog($event)"
      />
      <div class="pt-4">
        <lf-button
          v-if="collections.length < total && !loading"
          type="primary-ghost"
          @click="loadMore()"
        >
          Load more
        </lf-button>
        <div
          v-else-if="loading && collections.length > 0"
          class="flex items-center justify-center"
        >
          <span class="text-xs text-gray-400 mr-4">
            {{ offset }} out of {{ total }} collections
          </span>
          <div class="flex items-center text-xs text-primary-200">
            <lf-spinner :size="'1rem'" class="mr-1 border-primary-200" />
            Loading collections...
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="flex flex-col items-center">
      <app-empty-state-cta
        v-if="search.length"
        class="w-full !pb-0"
        icon="rectangle-history"
        :icon-size="100"
        title="No collections found"
        description="We couldn't find any results that match your search criteria, please try a different query"
      />
      <template v-else>
        <app-empty-state-cta
          class="w-full !pb-0"
          icon="rectangle-history"
          :icon-size="100"
          title="No collections yet"
          description="Start creating project collections of a certain area or tech stack"
        />
        <lf-button
          class="w-fit"
          size="medium"
          type="primary-ghost"
          @click="openCollectionAdd"
        >
          <lf-icon name="rectangle-history-circle-plus" :size="16" />
          Add collection
        </lf-button>
      </template>
    </div>
    <div
      v-if="loading && collections.length === 0"
      class="pt-8 flex justify-center"
    >
      <lf-spinner />
    </div>
  </div>

  <lf-collection-add
    v-if="isCollectionDialogOpen"
    v-model="isCollectionDialogOpen"
    :collection="collectionEditObject"
    @on-collection-created="onCollectionDialogCloseSuccess"
    @on-collection-edited="onCollectionDialogCloseSuccess"
    @update:model-value="onCollectionDialogClose"
  />

  <app-delete-confirm-dialog
    v-if="removeCollection"
    v-model="removeCollection"
    title="Are you sure you want to delete this collection?"
    description="This will delete the collection permanently. You can’t undo this action."
    icon="trash-can"
    confirm-button-text="Delete collection"
    cancel-button-text="Cancel"
    confirm-text="delete"
    @confirm="onRemoveCollection"
    @close="onCloseRemoveCollection"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import LfSearch from '@/ui-kit/search/Search.vue';
import { CollectionsService } from '@/modules/admin/modules/collections/services/collections.service';
import { CollectionModel } from '@/modules/admin/modules/collections/models/collection.model';
import LfCollectionAdd from '@/modules/admin/modules/collections/components/lf-collection-add.vue';
import Message from '@/shared/message/message';
import LfCollectionTable from '@/modules/admin/modules/collections/components/lf-collection-table.vue';
import AppEmptyStateCta from '@/shared/empty-state/empty-state-cta.vue';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import AppDeleteConfirmDialog from '@/shared/dialog/delete-confirm-dialog.vue';
import { cloneDeep } from 'lodash';

const search = ref('');
const loading = ref<boolean>(false);
const offset = ref(0);
const limit = ref(20);
const total = ref(0);
const collections = ref<CollectionModel[]>([]);
const removeCollection = ref<boolean>(false);
const removeCollectionId = ref<string>('');
const isCollectionDialogOpen = ref<boolean>(false);
const collectionEditObject = ref<CollectionModel | undefined>(undefined);

const fetchCollections = () => {
  if (loading.value) {
    return;
  }
  loading.value = true;
  CollectionsService.list({
    filter: search.value
      ? {
        name: {
          like: `%${search.value}%`,
        },
      }
      : {},
    offset: offset.value,
    limit: limit.value,
  })
    .then((res) => {
      if (offset.value > 0) {
        collections.value = [...collections.value, ...res.rows];
      } else {
        collections.value = res.rows;
      }

      if (res.rows.length < limit.value) {
        total.value = collections.value.length;
      } else {
        total.value = res.total;
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

const searchCollections = () => {
  offset.value = 0;
  fetchCollections();
};

const loadMore = () => {
  offset.value = collections.value.length;
  fetchCollections();
};

const openCollectionAdd = () => {
  isCollectionDialogOpen.value = true;
};

const onEditCollection = (collectionId: string) => {
  isCollectionDialogOpen.value = true;
  collectionEditObject.value = cloneDeep(
    collections.value.find((collection) => collection.id === collectionId),
  );
};

const ontoggleStar = (collectionId: string) => {
  Message.info(null, {
    title: 'Collection is being featured',
  });
  const collection = collections.value.find((collection) => collection.id === collectionId);
  collection!.starred = !collection!.starred;
  CollectionsService.update(collectionId, collection)
    .then(() => {
      Message.closeAll();
      Message.success(`Collection successfully ${collection!.starred ? 'featured' : 'unfeatured'}`);
      offset.value = 0;
      fetchCollections();
    })
    .catch(() => {
      Message.closeAll();
      Message.error('Something went wrong');
    });
};

const onCollectionDialogCloseSuccess = () => {
  isCollectionDialogOpen.value = false;
  collectionEditObject.value = undefined;
  offset.value = 0;
  fetchCollections();
};

const onCollectionDialogClose = () => {
  isCollectionDialogOpen.value = false;
  collectionEditObject.value = undefined;
};

const openRemoveCollectionDialog = (collectionId: string) => {
  removeCollectionId.value = collectionId;
  removeCollection.value = true;
};

const onRemoveCollection = () => {
  Message.info(null, {
    title: 'Collection is being deleted',
  });
  CollectionsService.delete(removeCollectionId.value)
    .then(() => {
      Message.closeAll();
      Message.success('Collection successfully deleted');
      offset.value = 0;
      fetchCollections();
      onCloseRemoveCollection();
    })
    .catch(() => {
      Message.closeAll();
      Message.error('Something went wrong');
      onCloseRemoveCollection();
    });
};

const onCloseRemoveCollection = () => {
  removeCollection.value = false;
  removeCollectionId.value = '';
};

onMounted(() => {
  searchCollections();
});
</script>

<script lang="ts">
export default {
  name: 'LfCollectionsPage',
};
</script>
