<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    @command="$event()"
  >
    <span class="el-dropdown-link">
      <i class="text-xl ri-more-line" />
    </span>
    <template #dropdown>
      <el-dropdown-item
        :command="openExecutions"
      >
        <i class="ri-history-line mr-2" /><span
          class="text-xs"
        >View executions</span>
      </el-dropdown-item>
      <template v-if="hasPermission(LfPermission.automationEdit)">
        <el-dropdown-item
          :command="edit"
        >
          <i class="ri-pencil-line mr-2" /><span
            class="text-xs"
          >Edit automation</span>
        </el-dropdown-item>
        <el-divider class="border-gray-200 my-2" />
        <el-dropdown-item
          :command="doDestroyWithConfirm"
        >
          <i
            class="ri-delete-bin-line mr-2 text-red-500"
          /><span class="text-xs text-red-500">Delete automation</span>
        </el-dropdown-item>
      </template>
    </template>
  </el-dropdown>
</template>

<script setup>
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { useAutomationStore } from '@/modules/automation/store';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const props = defineProps({
  automation: {
    type: Object,
    default: () => {
    },
  },
});

const emit = defineEmits([
  'openExecutionsDrawer',
  'openEditAutomationDrawer',
]);

const { hasPermission } = usePermissions();

const automationStore = useAutomationStore();
const { deleteAutomation } = automationStore;

const doDestroyWithConfirm = () => ConfirmDialog({
  type: 'danger',
  title: 'Delete automation',
  message:
            "Are you sure you want to proceed? You can't undo this action",
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  icon: 'ri-delete-bin-line',
})
  .then(() => deleteAutomation(props.automation.id));

const edit = () => {
  emit('openEditAutomationDrawer');
};
const openExecutions = () => {
  emit('openExecutionsDrawer');
};
</script>

<script>
export default {
  name: 'AppAutomationDropdown',
};
</script>
