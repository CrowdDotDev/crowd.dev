<template>
  <el-form-item prop="platforms" :rules="rules" class="mb-0">
    <div class="w-full">
      <article
        v-for="(platform, name) in platformOptions"
        :key="name"
        class="h-12 flex items-center border-b last:border-none border-gray-200 hover:bg-gray-50 hover:cursor-pointer"
      >
        <div>
          <img :src="platform.img" :alt="platform.label" class="min-w-6 h-6" />
        </div>
        <lf-switch v-model="platforms[name]" class="ml-4 flex-grow justify-between">
          <template #inactive>
            {{ platform.label }}
          </template>
        </lf-switch>
      </article>
    </div>
  </el-form-item>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';
import platformOptions from '@/modules/eagle-eye/constants/eagle-eye-platforms';
import LfSwitch from '@/ui-kit/switch/Switch.vue';

const emit = defineEmits(['update:platforms']);
const props = defineProps({
  platforms: {
    type: Object,
    required: true,
  },
  rules: {
    type: Object,
    default: null,
  },
});

const platforms = computed({
  get() {
    return props.platforms;
  },
  set(v) {
    emit('update:platforms', v);
  },
});
</script>
