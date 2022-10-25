<template>
  <div></div>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    @command="handleCommand"
  >
    <span class="el-dropdown-link">
      <i class="text-xl ri-more-line"></i>
    </span>
    <template #dropdown>
      <el-dropdown-item
        :command="{
          action: 'automationExecutions',
          automation: automation
        }"
        ><i class="ri-history-line mr-2" /><span
          class="text-xs"
          >View executions</span
        ></el-dropdown-item
      >
      <el-dropdown-item
        v-if="!isReadOnly"
        :command="{
          action: 'automationEdit',
          automation: automation
        }"
        ><i class="ri-pencil-line mr-2" /><span
          class="text-xs"
          >Edit webhook</span
        ></el-dropdown-item
      >
      <el-divider class="border-gray-200 my-2" />
      <el-dropdown-item
        v-if="!isReadOnly"
        :command="{
          action: 'automationDelete',
          automation: automation
        }"
        ><i
          class="ri-delete-bin-line mr-2 text-red-500"
        /><span class="text-xs text-red-500"
          >Delete webhook</span
        ></el-dropdown-item
      >
    </template>
  </el-dropdown>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { AutomationPermissions } from '@/modules/automation/automation-permissions'
import { i18n } from '@/i18n'
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'

export default {
  name: 'AppAutomationDropdown',
  props: {
    automation: {
      type: Object,
      default: () => {}
    }
  },
  emits: [
    'openExecutionsDrawer',
    'openEditAutomationDrawer'
  ],
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser'
    }),
    isReadOnly() {
      return (
        new AutomationPermissions(
          this.currentTenant,
          this.currentUser
        ).edit === false
      )
    }
  },
  methods: {
    ...mapActions({
      doDestroy: 'automation/doDestroy'
    }),
    async doDestroyWithConfirm(id) {
      try {
        await ConfirmDialog({
          title: i18n('common.confirm'),
          message: i18n('common.areYouSure'),
          confirmButtonText: i18n('common.yes'),
          cancelButtonText: i18n('common.no')
        })

        return this.doDestroy(id)
      } catch (error) {
        // no
      }
    },
    async handleCommand(command) {
      if (command.action === 'automationDelete') {
        return this.doDestroyWithConfirm(
          command.automation.id
        )
      } else if (command.action === 'automationEdit') {
        this.$emit('openEditAutomationDrawer')
      } else if (
        command.action === 'automationExecutions'
      ) {
        document.querySelector('body').click()
        this.$emit('openExecutionsDrawer')
      }
    }
  }
}
</script>
