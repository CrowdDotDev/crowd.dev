<template>
  <div>
    <el-dropdown
      v-if="!isReadOnly"
      trigger="click"
      @command="handleCommand"
    >
      <span class="el-dropdown-link">
        <i class="ri-xl ri-more-line"></i>
      </span>
      <template #dropdown>
        <el-dropdown-item command="activityEdit">
          <i class="ri-pencil-line mr1" />
          Edit Activity</el-dropdown-item
        >
        <el-dropdown-item command="activityDelete"
          ><i class="ri-delete-bin-line mr-1" />Delete
          Activity</el-dropdown-item
        >
      </template>
    </el-dropdown>
    <el-dialog
      v-model="editing"
      title="Edit Activity"
      :append-to-body="true"
      :destroy-on-close="true"
      custom-class="el-dialog--lg"
      @close="editing = false"
    >
      <app-activity-form-page
        :id="activity.id"
        @cancel="editing = false"
      >
      </app-activity-form-page>
    </el-dialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { i18n } from '@/i18n'
import ActivityFormPage from './activity-form-page'
import { ActivityPermissions } from '@/modules/activity/activity-permissions'

export default {
  name: 'AppActivityDropdown',
  components: {
    'app-activity-form-page': ActivityFormPage
  },
  props: {
    activity: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['activity-destroyed'],
  data() {
    return {
      editing: false
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
