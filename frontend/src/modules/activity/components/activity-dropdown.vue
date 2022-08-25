<template>
  <div>
    <el-dropdown
      trigger="click"
      @command="handleCommand"
      v-if="!isReadOnly"
    >
      <span class="el-dropdown-link">
        <i class="ri-xl ri-more-line"></i>
      </span>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item
          icon="ri-pencil-line"
          command="activityEdit"
          >Edit Activity</el-dropdown-item
        >
        <el-dropdown-item
          icon="ri-delete-bin-line"
          command="activityDelete"
          >Delete Activity</el-dropdown-item
        >
      </el-dropdown-menu>
    </el-dropdown>
    <el-dialog
      :visible.sync="editing"
      title="Edit Activity"
      :append-to-body="true"
      :destroy-on-close="true"
      @close="editing = false"
      custom-class="el-dialog--lg"
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
  name: 'app-activity-dropdown',
  props: {
    activity: {
      type: Object,
      default: () => {}
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
  components: {
    'app-activity-form-page': ActivityFormPage
  },
  data() {
    return {
      editing: false
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
