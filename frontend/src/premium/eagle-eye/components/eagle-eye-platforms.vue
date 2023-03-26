<template>
  <el-form-item
    prop="platforms"
    :rules="rules"
    class="mb-0"
  >
    <div class="w-full">
      <article
        v-for="(platform, name) in platformOptions"
        :key="name"
        class="h-12 flex items-center border-b last:border-none border-gray-200 hover:bg-gray-50 hover:cursor-pointer"
      >
        <div>
          <img :src="platform.img" :alt="platform.label" class="w-6 h-6" />
        </div>
        <el-switch
          v-model="platforms[name]"
          :inactive-text="platform.label"
          class="h-full"
        />
      </article>
    </div>
  </el-form-item>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';
import platformOptions from '@/premium/eagle-eye/constants/eagle-eye-platforms.json';

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
