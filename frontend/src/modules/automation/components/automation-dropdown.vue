<template>
  <el-dropdown
    v-if="!isReadOnly"
    trigger="click"
    @command="handleCommand"
  >
    <span class="el-dropdown-link">
      <i class="text-xl ri-more-line"></i>
    </span>
    <template #dropdown>
      <el-dropdown-item
        :command="{
          action: 'automationEdit',
          automation: automation
        }"
        ><i class="ri-pencil-line mr-1" />Edit
        Automation</el-dropdown-item
      >
      <el-dropdown-item
        :command="{
          action: 'automationDelete',
          automation: automation
        }"
        ><i class="ri-delete-bin-line mr-1" />Delete
        Automation</el-dropdown-item
      >
    </template>
  </el-dropdown>
</template>

<script>
import { AutomationPermissions } from '@/modules/automation/automation-permissions'

export default {
  name: 'AppAutomationDropdown',
  props: {
    automation: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
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
    handleCommand(command) {
      console.log(command)
    }
  }
}
</script>
