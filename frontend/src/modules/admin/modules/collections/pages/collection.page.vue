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
      <div v-if="collections.length < total" class="pt-4">
        <lf-button type="primary-ghost" loading-text="Loading collections..." :loading="loading" @click="loadMore()">
          Load more
        </lf-button>
      </div>
    </div>

    <div v-else-if="!loading">
      <app-empty-state-cta icon="rectangle-history" title="No collections found" />
    </div>
    <div v-if="loading" class="pt-8 flex justify-center">
      <lf-spinner />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import LfSearch from '@/ui-kit/search/Search.vue';
import { CollectionsService } from '@/modules/admin/modules/collections/services/collections.service';
import {
  CollectionModel,
} from '@/modules/admin/modules/collections/models/collection.model';
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

const fetchCollections = () => {
  if (loading.value) {
    return;
  }
  loading.value = true;
  CollectionsService.list({
    filter: {
      query: search.value,
    },
    offset: offset.value,
    limit: limit.value,
    orderBy: 'name_ASC',
  })
    .then((res) => {
      console.log('res', res);
      if (offset.value > 0) {
        collections.value = [...collections.value, ...res.rows];
      } else {
        collections.value = res.rows;
      }

      if (res.rows.length < limit.value) {
        total.value = collections.value.length;
      } else {
        total.value = res.count;
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
  console.log('onAddCollection');
};

const onEditCollection = (collectionId: string) => {
  console.log('onEditCollection', collectionId);
};

const onDeleteCollection = (collectionId: string) => {
  console.log('onDeleteCollection', collectionId);
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
