<template>
  <div>
    <el-dropdown
      v-if="!isReadOnly && organization"
      trigger="click"
      placement="bottom-end"
    >
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
        type="button"
        @click.prevent.stop
      >
        <i class="text-xl ri-more-fill" />
      </button>
      <template #dropdown>
        <app-organization-dropdown-content
          :organization="organization"
          @merge="emit('merge')"
          @close-dropdown="emit('closeDropdown')"
        />
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { computed } from 'vue';
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
});

const emit = defineEmits([
  'merge',
  'closeDropdown',
]);

const { currentUser, currentTenant } = mapGetters('auth');

const isReadOnly = computed(
  () => new OrganizationPermissions(
    currentTenant.value,
    currentUser.value,
  ).edit === false,
);
</script>

<script>
export default {
  name: 'AppOrganizationDropdown',
};
</script>
