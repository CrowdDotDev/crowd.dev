<template>
  <app-page-wrapper>
    <div class="settings">
      <h4>
        Automations
      </h4>
      <app-automation-list />
    </div>
  </app-page-wrapper>
</template>

<script lang="ts">
import AppAutomationList from '@/modules/automation/components/automation-list.vue';

export default {
  name: 'AppAutomationPage',
  components: { AppAutomationList },
};
</script>
