<template>
  <app-dialog
    v-model="model"
    size="small"
  >
    <template #header>
      <div class="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
        <i class="ri-checkbox-circle-fill text-xl text-green-600" />
      </div>
    </template>
    <template #content>
      <div class="px-6 pb-6">
        <div class="text-gray-900 text-base font-semibold mb-2">
          Workspace created successfully
        </div>
        <div class="text-gray-500 text-sm mb-6">
          Setup your workspace by connecting integrations and inviting your colleagues.
        </div>
        <router-link
          :to="{
            name: 'integration',
          }"
        >
          <el-button
            class="btn btn--bordered btn--full btn--md mb-3"
            @click="onCtaClick"
          >
            <i class="ri-apps-2-line text-lg text-gray-900" />
            <span>Connect integrations</span>
          </el-button>
        </router-link>
        <router-link
          :to="{
            name: 'settings',
          }"
        >
          <el-button
            class="btn btn--bordered btn--full btn--md"
            @click="onCtaClick"
          >
            <i class="ri-user-add-line text-lg text-gray-900" />
            <span>Invite your colleagues</span>
          </el-button>
        </router-link>
      </div>
    </template>
  </app-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void}>();
const props = defineProps<{
  modelValue: boolean,
}>();

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value: boolean) {
    emit('update:modelValue', value);
  },
});

const onCtaClick = () => {
  model.value = false;
};
</script>
