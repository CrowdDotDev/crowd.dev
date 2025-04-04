<template>
  <app-form-item
    class="mb-0 is-error-above"
    :validation="$v.platforms"
    :show-error="false"
  >
    <div class="w-full">
      <article
        v-for="(platform, name) in platformOptions"
        :key="name"
        class="h-12 flex items-center border-b last:border-none border-gray-200 hover:bg-gray-50 hover:cursor-pointer"
      >
        <div>
          <img :src="platform.img" :alt="platform.label" class="min-w-6 h-6" />
        </div>
        <lf-switch
          :model-value="platforms.includes(name)"
          class="ml-4 flex-grow justify-between"
          :checked-background="'var(--lf-color-secondary-500)'"
          @update:model-value="handlePlatformChange($event, name)"
          @change="$v.platforms.$touch"
        >
          <template #inactive>
            {{ platform.label }}
          </template>
        </lf-switch>
      </article>
    </div>
  </app-form-item>
</template>

<script setup>
import {
  defineProps, defineEmits, computed, onMounted,
} from 'vue';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import AppFormItem from '@/shared/form/form-item.vue';
import platformOptions from '@/modules/eagle-eye/constants/eagle-eye-platforms';
import LfSwitch from '@/ui-kit/switch/Switch.vue';

const emit = defineEmits(['update:platforms']);
const props = defineProps({
  platforms: {
    type: Array,
    required: true,
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

const rules = {
  platforms: {
    required,
  },
};

const $v = useVuelidate(rules, { platforms });

const handlePlatformChange = (enabled, platform) => {
  if (enabled) {
    platforms.value.push(platform);
  } else {
    platforms.value = platforms.value.filter((p) => p !== platform);
  }
};

onMounted(() => {
  $v.value.platforms.$touch();
});
</script>
