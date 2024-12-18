<template>
  <div v-if="hasPermission(LfPermission.subProjectEdit) && hasAccessToSegmentId(id)">
    <el-dropdown
      trigger="click"
      placement="bottom-end"
      @command="$event()"
    >
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
        type="button"
        @click.prevent.stop
      >
        <lf-icon name="ellipsis" :size="24" />
      </button>
      <template #dropdown>
        <el-dropdown-item
          class="h-10"
          :command="editSubProject"
        >
          <lf-icon name="pen" :size="16" class="mr-2" />
          <span class="text-xs">Edit sub-project</span>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import LfIcon from '@/ui-kit/icon/Icon.vue';

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
