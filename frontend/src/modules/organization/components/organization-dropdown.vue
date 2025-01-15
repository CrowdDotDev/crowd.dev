<template>
  <el-dropdown
    v-if="organization && hasPermissions"
    ref="dropdown"
    trigger="click"
    placement="bottom-end"
  >
    <slot name="trigger">
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
        type="button"
        @click.prevent.stop
      >
      <lf-icon name="ellipsis" type="regular" :size="24" />
      </button>
    </slot>
    <template #dropdown>
      <app-organization-dropdown-content
        :organization="organization"
        :hide-edit="hideEdit"
        :hide-merge="hideMerge"
        @merge="emit('merge')"
        @close-dropdown="onDropdownClose"
        @unmerge="emit('unmerge')"
      />
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed, ref } from 'vue';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import AppOrganizationDropdownContent from './organization-dropdown-content.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
  hideEdit: {
    type: Boolean,
    default: false,
  },
  hideMerge: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'merge',
  'unmerge',
  'closeDropdown',
]);

const { hasPermission } = usePermissions();

const hasPermissions = computed(() => [LfPermission.organizationEdit,
  LfPermission.organizationDestroy,
  LfPermission.mergeOrganizations]
  .some((permission) => hasPermission(permission)));

const dropdown = ref();

const onDropdownClose = () => {
  dropdown.value?.handleClose();
  emit('closeDropdown');
};
</script>

<script>
export default {
  name: 'AppOrganizationDropdown',
};
</script>
