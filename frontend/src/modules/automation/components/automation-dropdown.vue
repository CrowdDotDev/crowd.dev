<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    @command="$event()"
  >
    <span class="el-dropdown-link">
      <lf-icon name="ellipsis" type="regular" :size="24" />
    </span>
    <template #dropdown>
      <el-dropdown-item
        :command="openExecutions"
      >
        <lf-icon name="clock-rotate-left" class="mr-2" />
        <span
          class="text-xs"
        >View executions</span>
      </el-dropdown-item>
      <template v-if="hasPermission(LfPermission.automationEdit)">
        <el-dropdown-item
          :command="edit"
        >
          <lf-icon name="pen" class="mr-2" />
          <span class="text-xs">Edit automation</span>
        </el-dropdown-item>
        <el-divider class="border-gray-200 my-2" />
        <el-dropdown-item
          :command="doDestroyWithConfirm"
        >
          <lf-icon name="trash-can" class="mr-2 text-red-500" />
          <span class="text-xs text-red-500">Delete automation</span>
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
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfIcon from '@/ui-kit/icon/Icon.vue';

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
const { trackEvent } = useProductTracking();

const automationStore = useAutomationStore();
const { deleteAutomation } = automationStore;

const doDestroyWithConfirm = () => ConfirmDialog({
  type: 'danger',
  title: 'Delete automation',
  message:
            "Are you sure you want to proceed? You can't undo this action",
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  icon: 'fa-light fa-trash-can',
})
  .then(() => {
    trackEvent({
      key: FeatureEventKey.DELETE_AUTOMATION,
      type: EventType.FEATURE,
      properties: {
        automationType: props.automation.type,
      },
    });

    deleteAutomation(props.automation.id);
  });

const edit = () => {
  emit('openEditAutomationDrawer');
};
const openExecutions = () => {
  trackEvent({
    key: FeatureEventKey.VIEW_AUTOMATION_EXECUTION,
    type: EventType.FEATURE,
  });

  emit('openExecutionsDrawer');
};
</script>

<script>
export default {
  name: 'AppAutomationDropdown',
};
</script>
