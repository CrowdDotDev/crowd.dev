<template>
  <div>
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
        <i class="text-xl ri-more-fill" />
      </button>
      <template #dropdown>
        <el-dropdown-item
          v-if="hasPermission(LfPermission.projectGroupEdit) && hasAccessToSegmentId(id)"
          class="h-10 mb-1"
          :command="editProjectGroup"
        >
          <i
            class="ri-pencil-line text-base mr-2"
          />
          <span class="text-xs">Edit project group</span>
        </el-dropdown-item>
        <el-dropdown-item
          v-if="hasPermission(LfPermission.projectCreate) && hasAccessToSegmentId(id)"
          class="h-10 mb-1"
          :command="addProject"
        >
          <i
            class="ri-add-line text-base mr-2"
          /><span class="text-xs">Add project</span>
        </el-dropdown-item>
        <el-divider
          v-if="(hasPermission(LfPermission.projectGroupEdit) && hasAccessToSegmentId(id))
            || (hasPermission(LfPermission.projectCreate) && hasAccessToSegmentId(id))"
          class="border-gray-200 !my-2"
        />
        <el-dropdown-item
          class="h-10"
          :command="() => updateSelectedProjectGroup(id)"
        >
          <i
            class="ri-external-link-line text-base mr-2"
          /><span
            class="text-xs"
          >View projects</span>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const emit = defineEmits(['onEditProjectGroup', 'onAddProject']);

defineProps({
  id: {
    type: String,
    default: null,
  },
});

const lsSegmentsStore = useLfSegmentsStore();
const { updateSelectedProjectGroup } = lsSegmentsStore;

const { hasPermission, hasAccessToSegmentId } = usePermissions();

const editProjectGroup = () => {
  emit('onEditProjectGroup');
};

const addProject = () => {
  emit('onAddProject');
};
</script>

<script>
export default {
  name: 'AppLfProjectGroupsDropdown',
};
</script>
