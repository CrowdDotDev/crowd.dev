<template>
  <div v-if="(hasPermissionToCreateSubProject && hasAccessToSegmentId(id)) || (hasPermissionToEditProject && hasAccessToSegmentId(id))">
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
          v-if="(hasPermissionToEditProject && hasAccessToSegmentId(id))"
          class="h-10 mb-1"
          :command="editProject"
        >
          <i
            class="ri-pencil-line text-base mr-2"
          />
          <span class="text-xs">Edit project</span>
        </el-dropdown-item>
        <el-dropdown-item
          v-if="(hasPermissionToCreateSubProject && hasAccessToSegmentId(id))"
          class="h-10"
          :command="addSubProject"
        >
          <i
            class="ri-add-line text-base mr-2"
          /><span class="text-xs">Add sub-project</span>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { LfPermissions } from '@/modules/lf/lf-permissions';
import { computed } from 'vue';
import { hasAccessToSegmentId } from '@/utils/segments';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';

defineProps({
  id: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['onEditProject', 'onAddSubProject']);

const authStore = useAuthStore();
const { user, tenant } = storeToRefs(authStore);

const hasPermissionToCreateSubProject = computed(() => new LfPermissions(
  tenant.value,
  user.value,
)?.createSubProject);

const hasPermissionToEditProject = computed(() => new LfPermissions(
  tenant.value,
  user.value,
)?.editProject);

const editProject = () => {
  emit('onEditProject');
};

const addSubProject = () => {
  emit('onAddSubProject');
};
</script>

<script>
export default {
  name: 'AppLfProjectsDropdown',
};
</script>
