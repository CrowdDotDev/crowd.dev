<template>
  <div v-if="hasPermission(LfPermission.subProjectEdit) && hasAccessToSegmentId(id)">
    <lf-dropdown placement="bottom-end" width="12rem">
      <template #trigger>
        <lf-button type="secondary-ghost-light" icon-only>
          <lf-icon name="ellipsis" type="regular" />
        </lf-button>
      </template>
      <lf-dropdown-item @click="editSubProject()">
        <lf-icon name="pen" />
        Edit sub-project
      </lf-dropdown-item>
    </lf-dropdown>
  </div>
</template>

<script setup>
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';

defineProps({
  id: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['onEditSubProject']);

const { hasPermission, hasAccessToSegmentId } = usePermissions();

const editSubProject = () => {
  emit('onEditSubProject');
};
</script>

<script>
export default {
  name: 'AppLfSubProjectsDropdown',
};
</script>
