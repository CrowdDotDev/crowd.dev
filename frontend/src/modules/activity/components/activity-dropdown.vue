<template>
  <div>
    <el-dropdown
      v-if="!isReadOnly"
      placement="bottom-end"
      trigger="click"
      @command="handleCommand"
      @visible-change="dropdownVisible = $event"
    >
      <span
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200"
      >
        <i class="ri-xl ri-more-fill"></i>
      </span>
      <template #dropdown>
        <!-- TODO: uncomment this once activity editing is done -->
        <!--        <el-dropdown-item command="activityEdit">-->
        <!--          <i class="ri-pencil-line text-gray-400 mr-1" />-->
        <!--          <span>Edit Activity</span></el-dropdown-item-->
        <!--        >-->
        <el-dropdown-item command="activityDelete">
          <i class="ri-delete-bin-line text-red-500 mr-1" />
          <span class="text-red-500">Delete Activity</span>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { i18n } from '@/i18n'
import { ActivityPermissions } from '@/modules/activity/activity-permissions'
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'

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
          title: i18n('common.confirm'),
          message: i18n('common.areYouSure'),
          confirmButtonText: i18n('common.yes'),
          cancelButtonText: i18n('common.no')
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
