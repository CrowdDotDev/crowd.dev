<template>
  <div>
    <lf-dropdown placement="bottom-end" width="14rem">
      <template #trigger>
        <lf-button type="secondary-ghost" icon-only>
          <lf-icon name="ellipsis" :size="24" class="text-gray-900" />
        </lf-button>
      </template>
      <lf-dropdown-item
        v-if="hasPermission(LfPermission.collectionEdit)"
        @click="editCollection()"
      >
        <lf-icon name="pen fa-sharp" />
        Edit collection
      </lf-dropdown-item>
      <lf-dropdown-item
        v-if="hasPermission(LfPermission.collectionDelete)"
        @click="deleteCollection()"
      >
        <lf-icon name="trash-can" />
        Delete collection
      </lf-dropdown-item>
    </lf-dropdown>
  </div>
</template>

<script setup lang="ts">
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';

const emit = defineEmits<{(e: 'onEditCollection', id: string): void,
  (e: 'onDeleteCollection', id: string): void,
}>();

const props = defineProps<{
  id: string,
}>();

const { hasPermission } = usePermissions();

const editCollection = () => {
  emit('onEditCollection', props.id);
};

const deleteCollection = () => {
  emit('onDeleteCollection', props.id);
};
</script>

<script lang="ts">
export default {
  name: 'LfCollectionDropdown',
};
</script>
