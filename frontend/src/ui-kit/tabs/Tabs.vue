<template>
  <div class="c-tabs" :class="`c-tabs--${props.size}`">
    <slot />
  </div>
</template>

<script setup lang="ts">
import {
  computed, onBeforeMount, onMounted, ref, useSlots, watch,
} from 'vue';
import { useRoute } from 'vue-router';
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
const slots = useSlots();

const tabList = ref<string[]>([]);

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
    if (tabList.value.includes(hash)) {
      tabsValue.value = hash;
    }
  }
};

onMounted(() => {
  readHash();
});

onBeforeMount(() => {
  if (slots.default) {
    tabList.value = slots.default()
      .filter((child) => child.type.name === 'LfTab')
      .map((tab) => tab.props.name);
  }
});

watch(() => route.hash, () => {
  readHash();
});

defineExpose({
  tabsValue,
});
</script>

<script lang="ts">
export default {
  name: 'LfTabs',
};
</script>
