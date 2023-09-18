<template>
  <div>
    <el-button
      class="btn btn-link btn-link--md btn-link--primary"
      @click="settingsDrawerOpen = true"
    >
      <i class="ri-settings-2-line mr-2" />Settings
    </el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const settingsDrawerOpen = ref(true);
</script>

<script>
export default {
  name: 'AppGithubSettings',
};
</script>
