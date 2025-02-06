<template>
  <lf-table class="!overflow-visible" show-hover>
    <thead>
      <tr>
        <lf-table-head class="pl-2 w-[45%]">
          Collection
        </lf-table-head>
        <lf-table-head class="pl-3 min-w-[26%]">
          Projects
        </lf-table-head>
        <lf-table-head class="w-12" />
      </tr>
    </thead>
    <tbody>
      <tr v-for="collection of collections" :key="collection.id">
        <lf-table-cell class="pl-2">
          <div class="text-black text-sm font-semibold flex items-center">
            <lf-icon name="rectangle-history" :size="16" class="text-gray-400 mr-2" />
            {{ collection.name }}
          </div>
        </lf-table-cell>

        <lf-table-cell>
          <app-lf-project-column :projects="collection.projects" />
        </lf-table-cell>

        <lf-table-cell class="pr-2 flex justify-end">
          <lf-collection-dropdown
            :id="collection.id"
            @on-edit-collection="emit('onEditCollection', collection.id)"
            @on-delete-collection="emit('onDeleteCollection', collection.id)"
          />
        </lf-table-cell>
      </tr>
    </tbody>
  </lf-table>
</template>

<script setup lang="ts">
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfTable from '@/ui-kit/table/Table.vue';
import LfTableCell from '@/ui-kit/table/TableCell.vue';
import LfTableHead from '@/ui-kit/table/TableHead.vue';
import AppLfProjectColumn from '@/modules/admin/modules/projects/components/fragments/lf-project-column.vue';
import LfCollectionDropdown from './lf-collection-dropdown.vue';
import { CollectionModel } from '../models/collection.model';

const emit = defineEmits<{(e: 'onEditCollection', id: string): void,
  (e: 'onDeleteCollection', id: string): void,
}>();

defineProps<{
  collections: CollectionModel[],
}>();

</script>

<script lang="ts">
export default {
  name: 'LfCollectionTable',
};
</script>
