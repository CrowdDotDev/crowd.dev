<template>
  <div>
    <div class="flex gap-4 pt-6 pb-4">
      <!-- Search input -->
      <lf-search
        v-model="search"
        class="h-9 flex-grow"
        :lazy="true"
        placeholder="Search collections..."
        @update:model-value="searchCollections()"
      />
      <lf-button size="medium" type="secondary-ghost" @click="onAddCollection">
        <lf-icon name="rectangle-history-circle-plus" :size="16" />
        Add collection
      </lf-button>
    </div>
    <div v-if="collections.length > 0">
      <lf-collection-table
        :collections="collections"
        @on-edit-collection="onEditCollection($event)"
        @on-delete-collection="onDeleteCollection($event)"
      />
      <div class="pt-4">
        <lf-button v-if="collections.length < total && !loading" type="primary-ghost" @click="loadMore()">
          Load more
        </lf-button>
        <div v-else-if="loading && collections.length > 0" class="flex items-center justify-center">
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
        title="No collections found"
        description="We couldn't find any results that match your search criteria, please try a different query"
      />
      <template v-else>
        <app-empty-state-cta
          class="w-full !pb-0"
          icon="rectangle-history"
          title="No collections yet"
          description="Start creating project collections of a certain area or tech stack"
        />
        <lf-button class="w-fit" size="medium" type="primary-ghost" @click="onAddCollection">
          <lf-icon name="rectangle-history-circle-plus" :size="16" />
          Add collection
        </lf-button>
      </template>
    </div>
    <div v-if="loading && collections.length === 0" class="pt-8 flex justify-center">
      <lf-spinner />
    </div>
  </div>

  <lf-collection-add v-if="collectionAdd" v-model="collectionAdd" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import LfSearch from '@/ui-kit/search/Search.vue';
import { CollectionsService } from '@/modules/admin/modules/collections/services/collections.service';
import {
  CollectionModel,
} from '@/modules/admin/modules/collections/models/collection.model';
import LfCollectionAdd from '@/modules/admin/modules/collections/components/lf-collection-add.vue';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import Message from '@/shared/message/message';
import LfCollectionTable from '@/modules/admin/modules/collections/components/lf-collection-table.vue';
import AppEmptyStateCta from '@/shared/empty-state/empty-state-cta.vue';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const search = ref('');
const loading = ref<boolean>(false);
const offset = ref(0);
const limit = ref(20);
const total = ref(0);
const collections = ref<CollectionModel[]>([]);
const collectionAdd = ref<boolean>(false);

const fetchCollections = () => {
  if (loading.value) {
    return;
  }
  loading.value = true;
  CollectionsService.list({
    filter: search.value ? {
      name: {
        like: `%${search.value}%`,
      },
    } : {},
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

const onAddCollection = () => {
  collectionAdd.value = true;
};

const onEditCollection = (collectionId: string) => {
  console.log('onEditCollection', collectionId);
};

const onDeleteCollection = (collectionId: string) => {
  ConfirmDialog({
    type: 'danger',
    title: 'Delete collection',
    message: "Are you sure you want to proceed? You can't undo this action",
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    icon: 'fa-trash-can fa-light',
  }).then(() => {
    Message.info(null, {
      title: 'Collection is being deleted',
    });
    CollectionsService.delete(collectionId)
      .then(() => {
        Message.closeAll();
        Message.success('Collection successfully deleted');
        fetchCollections();
      })
      .catch(() => {
        Message.closeAll();
        Message.error('Something went wrong');
      });
  });
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
