<template>
  <div class="flex items-center">
    <el-switch
      :model-value="automation.state === 'active'"
      style="
        --el-switch-on-color: #22c55e;
        --el-switch-off-color: #cbd5e1;
      "
      @change="handleChange"
    />
    <span class="ml-2">
      {{ automation.state === 'active' ? 'On' : 'Off' }}
    </span>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
export default {
  name: 'AppAutomationToggle',
  props: {
    automation: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    ...mapActions({
      doPublish: 'automation/doPublish',
      doUnpublish: 'automation/doUnpublish'
    }),
    handleChange(value) {
      if (value) {
        this.doPublish(this.automation)
      } else {
        this.doUnpublish(this.automation)
      }
    }
  }
}
</script>
