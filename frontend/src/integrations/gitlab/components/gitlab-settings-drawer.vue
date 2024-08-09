<template>
  <app-drawer
    v-model="isDrawerVisible"
    title="GitLab"
    size="600px"
    pre-title="Integration"
    :show-footer="true"
    has-border
    @close="isDrawerVisible = false"
  >
    Hello
  </app-drawer>
</template>

<script setup lang="ts">
import {
  ref, computed, watch, onMounted,
} from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  modelValue: boolean;
  integration: any;
}>();

const emit = defineEmits(['update:modelValue']);

// Drawer visibility
const isDrawerVisible = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});
</script>

<script lang="ts">
export default {
  name: 'AppGitlabSettingsDrawer',
};
</script>
