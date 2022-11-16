<template>
  <el-dropdown
    v-if="taskDestroyPermission || taskEditPermission"
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
        v-if="
          task.status === 'in-progress' &&
          taskEditPermission
        "
        class="w-55"
        :command="{
          action: 'taskEdit'
        }"
        ><i
          class="ri-pencil-line mr-1 text-gray-400"
        /><span>Edit task</span></el-dropdown-item
      >

      <el-dropdown-item
        v-if="
          task.status === 'archived' &&
          taskDestroyPermission
        "
        class="w-55"
        :command="{
          action: 'taskUnarchive'
        }"
        ><i
          class="ri-inbox-unarchive-line mr-1 text-gray-400"
        /><span>Unarchive task</span></el-dropdown-item
      >
      <el-dropdown-item
        v-if="
          task.status === 'in-progress' &&
          taskDestroyPermission
        "
        class="w-55"
        divided
        :command="{
          action: 'taskDelete'
        }"
        ><i
          class="ri-delete-bin-line mr-1 text-red-500"
        /><span class="text-red-500"
          >Delete task</span
        ></el-dropdown-item
      >
      <el-dropdown-item
        v-if="
          task.status === 'archived' &&
          taskDestroyPermission
        "
        class="w-55"
        divided
        :command="{
          action: 'taskDeletePermanently'
        }"
        ><i
          class="ri-delete-bin-line mr-1 text-red-500"
        /><span class="text-red-500"
          >Delete permanently</span
        ></el-dropdown-item
      >
    </template>
  </el-dropdown>
</template>

<script>
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'
import { TaskService } from '@/modules/task/task-service'
import { mapActions, mapGetters } from 'vuex'
import { TaskPermissions } from '@/modules/task/task-permissions'

export default {
  name: 'AppTaskDropdown',
  props: {
    task: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      dropdownVisible: false
    }
  },
  computed: {
    ...mapGetters('auth', ['currentTenant', 'currentUser']),
    taskEditPermission() {
      return new TaskPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },
    taskDestroyPermission() {
      return new TaskPermissions(
        this.currentTenant,
        this.currentUser
      ).destroy
    }
  },
  methods: {
    ...mapActions('task', [
      'reloadTaskPage',
      'editTask',
      'reloadArchivedTasks',
      'reloadClosedTasks'
    ]),
    doDestroyWithConfirm(archived) {
      ConfirmDialog({
        type: 'danger',
        title: 'Delete task',
        message:
          'Are you sure you want to delete this task? You can’t undo this action.',
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        icon: 'ri-delete-bin-line'
      })
        .then(() => {
          return TaskService.delete([this.task.id])
        })
        .then(() => {
          if (archived) {
            this.reloadArchivedTasks()
          } else {
            this.reloadTaskPage()
          }
        })
    },
    doUnarchive() {
      return TaskService.update(this.task.id, {
        status: 'done'
      }).then(() => {
        this.reloadClosedTasks()
        this.reloadArchivedTasks()
      })
    },
    handleCommand(command) {
      if (command.action === 'taskDelete') {
        return this.doDestroyWithConfirm(false)
      } else if (command.action === 'taskEdit') {
        this.editTask(this.task)
      } else if (
        command.action === 'taskDeletePermanently'
      ) {
        return this.doDestroyWithConfirm(true)
      } else if (command.action === 'taskUnarchive') {
        return this.doUnarchive()
      }
    }
  }
}
</script>
