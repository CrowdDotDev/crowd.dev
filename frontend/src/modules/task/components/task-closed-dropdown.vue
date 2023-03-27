<template>
  <el-dropdown
    v-if="taskDestroyPermission"
    trigger="click"
    placement="bottom-end"
    @command="handleCommand"
  >
    <button
      class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
      type="button"
      @click.stop
    >
      <i class="text-xl ri-more-fill" />
    </button>
    <template #dropdown>
      <el-dropdown-item
        class="w-55"
        :command="{
          action: 'tasksArchive',
        }"
      >
        <i
          class="ri-archive-line mr-1 text-gray-400"
        /><span>Archive all</span>
      </el-dropdown-item>
      <el-dropdown-item
        class="w-55"
        :command="{
          action: 'tasksDelete',
        }"
        divided
      >
        <i class="ri-delete-bin-line mr-1 text-red" /><span
          class="text-red"
        >Delete all permanently</span>
      </el-dropdown-item>
    </template>
  </el-dropdown>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { TaskService } from '@/modules/task/task-service';
import { TaskPermissions } from '@/modules/task/task-permissions';

export default {
  name: 'AppTaskClosedDropdown',
  data() {
    return {
      dropdownVisible: false,
    };
  },
  computed: {
    ...mapGetters('auth', ['currentTenant', 'currentUser']),
    taskDestroyPermission() {
      return new TaskPermissions(
        this.currentTenant,
        this.currentUser,
      ).destroy;
    },
  },
  methods: {
    ...mapActions('task', [
      'reloadClosedTasks',
      'reloadArchivedTasks',
    ]),
    doDestroyWithConfirm() {
      ConfirmDialog({
        type: 'danger',
        title: 'Delete completed tasks',
        message:
          'Are you sure you want to delete completed tasks? You can’t undo this action.',
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        icon: 'ri-delete-bin-line',
      })
        .then(() => TaskService.batch('findAndDeleteAll', {
          filter: {
            status: 'done',
          },
        }))
        .then(() => {
          this.reloadClosedTasks();
        });
    },
    doArchive() {
      return TaskService.batch('findAndUpdateAll', {
        filter: {
          status: 'done',
        },
        update: {
          status: 'archived',
        },
      }).then(() => {
        this.reloadClosedTasks();
        this.reloadArchivedTasks();
      });
    },
    handleCommand(command) {
      if (command.action === 'tasksDelete') {
        return this.doDestroyWithConfirm();
      }
      if (command.action === 'tasksArchive') {
        return this.doArchive();
      }
      return null;
    },
  },
};
</script>
