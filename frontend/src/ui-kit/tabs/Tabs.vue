<template>
  <div class="c-tabs" :class="`c-tabs--${props.size}`">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { TabsSize } from '@/ui-kit/tabs/types/TabsSize';

const props = withDefaults(defineProps<{
  modelValue?: string,
  size?: TabsSize
}>(), {
  modelValue: '',
  size: 'medium',
});

const emit = defineEmits<{(e: 'update:modelValue', value: string): void}>();

const route = useRoute();
const router = useRouter();

const tabsValue = computed({
  get() {
    return props.modelValue || '';
  },
  set(value: string) {
    emit('update:modelValue', value);
  },
});

const readHash = () => {
  const hash = route?.hash.replace('#', '');
  if (hash && hash !== tabsValue.value) {
    tabsValue.value = hash;
  } else {
    router?.push({
      hash: `#${tabsValue.value}`,
      query: {},
    });
  }
};

onMounted(() => {
  readHash();
});

watch(() => route.hash, (newHash) => {
  readHash();
});
</script>

<script lang="ts">
export default {
  name: 'LfTabs',
};
</script>
