<template>
  <el-dropdown
    v-if="!isReadOnly && organization"
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
        <i class="text-xl ri-more-fill" />
      </button>
    </slot>
    <template #dropdown>
      <app-organization-dropdown-content
        :organization="organization"
        :hide-edit="hideEdit"
        :hide-merge="hideMerge"
        @merge="emit('merge')"
        @close-dropdown="onDropdownClose"
      />
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed, ref } from 'vue';
import {
  mapGetters,
} from '@/shared/vuex/vuex.helpers';
import { OrganizationPermissions } from '../organization-permissions';
import AppOrganizationDropdownContent from './organization-dropdown-content.vue';

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
  'closeDropdown',
]);

const { currentUser, currentTenant } = mapGetters('auth');

const dropdown = ref();

const isReadOnly = computed(
  () => new OrganizationPermissions(
    currentTenant.value,
    currentUser.value,
  ).edit === false,
);

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
