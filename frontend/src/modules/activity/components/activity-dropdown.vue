<template>
  <div>
    <el-dropdown
      v-if="!isReadOnly"
      placement="bottom-end"
      trigger="click"
      @command="handleCommand"
    >
      <span
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200"
      >
        <i
          class="text-lg leading-none text-gray-600 ri-more-fill"
        ></i>
      </span>
      <template #dropdown>
        <el-dropdown-item command="activityDelete"
          ><i class="ri-delete-bin-line mr-1" />Delete
          Activity</el-dropdown-item
        >
      </template>
    </el-dropdown>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { i18n } from '@/i18n'
import { ActivityPermissions } from '@/modules/activity/activity-permissions'

export default {
  name: 'AppActivityDropdown',
  props: {
    activity: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['activity-destroyed'],
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
      doDestroy: 'activity/destroy/doDestroy'
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
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

        await this.doDestroy(this.activity.id)
        this.$emit('activity-destroyed', this.activity.id)
      } catch (error) {
        // no
      }
    }
  }
}
</script>
