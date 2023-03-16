<template>
  <div>
    <el-dropdown
      v-if="!isReadOnly"
      placement="bottom-end"
      trigger="click"
      @command="handleCommand"
      @visible-change="dropdownVisible = $event"
    >
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
        type="button"
        @click.stop
      >
        <i class="text-xl ri-more-fill"></i>
      </button>
      <template #dropdown>
        <!-- TODO: uncomment this once activity editing is done -->
        <!--        <el-dropdown-item command="activityEdit">-->
        <!--          <i class="ri-pencil-line text-gray-400 mr-1" />-->
        <!--          <span>Edit Activity</span></el-dropdown-item-->
        <!--        >-->
        <el-dropdown-item
          command="activityDelete"
          :disabled="isDeleteLockedForSampleData"
        >
          <i
            class="ri-delete-bin-line mr-1"
            :class="{
              'text-red-500': !isDeleteLockedForSampleData
            }"
          />
          <span
            :class="{
              'text-red-500': !isDeleteLockedForSampleData
            }"
            >Delete activity</span
          >
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { ActivityPermissions } from '@/modules/activity/activity-permissions'
import ConfirmDialog from '@/shared/dialog/confirm-dialog.js'

export default {
  name: 'AppActivityDropdown',
  props: {
    activity: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['activity-destroyed'],
  data() {
    return {
      dropdownVisible: false
    }
  },
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser'
    }),
    isReadOnly() {
      return (
        new ActivityPermissions(
          this.currentTenant,
          this.currentUser
        ).edit === false
      )
    },
    isDeleteLockedForSampleData() {
      return new ActivityPermissions(
        this.currentTenant,
        this.currentUser
      ).destroyLockedForSampleData
    }
  },
  methods: {
    ...mapActions({
      doDestroy: 'activity/doDestroy'
    }),
    handleCommand(command) {
      if (command === 'activityDelete') {
        return this.doDestroyWithConfirm()
      } else if (command === 'activityEdit') {
        this.editing = true
      } else {
        return this.$router.push({
          name: command,
          params: { id: this.activity.id }
        })
      }
    },
    async doDestroyWithConfirm() {
      try {
        await ConfirmDialog({
          type: 'danger',
          title: 'Delete activity',
          message:
            "Are you sure you want to proceed? You can't undo this action",
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          icon: 'ri-delete-bin-line'
        })

        await this.doDestroy(this.activity.id)
        this.$emit('activity-destroyed', this.activity.id)
      } catch (error) {
        // no
      }
    }
  }
}
</script>
