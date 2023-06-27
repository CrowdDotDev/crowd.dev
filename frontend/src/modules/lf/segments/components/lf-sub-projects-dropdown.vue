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
          class="h-10"
          :command="editSubProject"
        >
          <i
            class="ri-pencil-line text-base mr-2"
          />
          <span class="text-xs">Edit sub-project</span>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
const emit = defineEmits(['onEditSubProject']);

const editSubProject = () => {
  emit('onEditSubProject');
};
</script>

<script>
export default {
  name: 'AppLfSubProjectsDropdown',
};
</script>
