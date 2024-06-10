<template>
  <div class="c-tabs" :class="`c-tabs--${props.size}`">
    <slot />
  </div>
</template>

<script setup lang="ts">
import {
  computed, onBeforeMount, onMounted, ref, useSlots, watch,
} from 'vue';
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

const setHash = (hash) => {
  router?.push({
    hash: `#${hash}`,
    query: {},
  });
};

const readHash = () => {
  const hash = route?.hash.replace('#', '');
  if (hash && hash !== tabsValue.value) {
    if (tabList.value.includes(hash)) {
      tabsValue.value = hash;
    } else if (tabList.value.length > 0) {
      setHash(tabList.value[0]);
    } else {
      setHash(tabsValue.value);
    }
  } else {
    setHash(tabsValue.value);
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

watch(() => route.hash, (newHash) => {
  readHash();
});
</script>

<script lang="ts">
export default {
  name: 'LfTabs',
};
</script>
