<template>
  <div>
    <el-dropdown
      placement="bottom-end"
      trigger="click"
      @command="$event()"
    >
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
        type="button"
        @click.stop
      >
        <i class="text-xl ri-more-fill" />
      </button>
      <template #dropdown>
        <el-dropdown-item :command="edit">
          <i class="ri-pencil-line text-gray-400 mr-1" />
          <span>Edit Activity type</span>
        </el-dropdown-item>
        <el-dropdown-item
          divided
          :command="doDestroyWithConfirm"
        >
          <i class="ri-delete-bin-line text-red-500 mr-1" />
          <span class="text-red-500">Delete activity type</span>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { useActivityTypeStore } from '@/modules/activity/store/type';

const props = defineProps({
  activityTypeKey: {
    type: Object,
    default: () => {},
  },
  subprojectId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['edit']);

const { deleteActivityType } = useActivityTypeStore();

const doDestroyWithConfirm = () => {
  ConfirmDialog({
    type: 'danger',
    title: 'Delete activity type',
    message:
      "Are you sure you want to proceed? You can't undo this action",
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    icon: 'ri-delete-bin-line',
  }).then(() => {
    deleteActivityType(props.activityTypeKey, [props.subprojectId]);
  });
};

const edit = () => {
  emit('edit');
};
</script>

<script>
export default {
  name: 'AppActivityTypeDropdown',
};
</script>
