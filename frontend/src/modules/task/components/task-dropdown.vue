<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    @command="handleCommand"
  >
    <button
      class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
      type="button"
      @click.stop
    >
      <i class="text-xl ri-more-fill"></i>
    </button>
    <template #dropdown>
      <el-dropdown-item
        class="w-55"
        :command="{
          action: 'taskEdit'
        }"
        ><i
          class="ri-pencil-line mr-1 text-gray-400"
        /><span>Edit task</span></el-dropdown-item
      >
      <el-dropdown-item
        class="w-55"
        divided
        :command="{
          action: 'taskDelete'
        }"
        ><i class="ri-delete-bin-line mr-1 text-red" /><span
          class="text-red"
          >Delete task</span
        ></el-dropdown-item
      >
    </template>
  </el-dropdown>
</template>

<script>
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'

export default {
  name: 'AppTaskDropdown',
  props: {
    task: {
      type: Object,
      required: true
    }
  },
  emits: ['edit'],
  data() {
    return {
      dropdownVisible: false
    }
  },
  methods: {
    doDestroyWithConfirm() {
      ConfirmDialog({
        type: 'danger',
        title: 'Delete task',
        message:
          'Are you sure you want to delete this task? You can’t undo this action.',
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        icon: 'ri-delete-bin-line'
      }).then(() => {})
    },
    async handleCommand(command) {
      if (command.action === 'taskDelete') {
        return this.doDestroyWithConfirm()
      } else if (command.action === 'taskEdit') {
        this.$emit('edit')
      }
    }
  }
}
</script>
