<template>
  <el-input
    v-model="model"
    clearable
    :placeholder="props.placeholder"
    class="input-with-select"
    data-qa="filter-search"
    @input="changeValue($event)"
  >
    <template #prefix>
      <i class="ri-search-line text-gray-400" />
    </template>
    <template #append>
      <slot name="append" />
    </template>
  </el-input>
</template>

<script setup lang="ts">
import {
  defineProps, ref, watch,
} from 'vue';
import { debounce } from 'lodash';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import { useRouter } from 'vue-router';

const props = defineProps<{
  modelValue: string,
  placeholder?: string,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string)}>();

const model = ref('');

const { trackEvent } = useProductTracking();
const router = useRouter();

watch(() => props.modelValue, (value) => {
  model.value = value;
}, {
  immediate: true,
});

const changeValue = debounce((search: string) => {
  let key: FeatureEventKey | null = null;
  const { name: routeName, hash: routeHash } = router.currentRoute.value;

  if (routeName === 'member') {
    key = FeatureEventKey.SEARCH_CONTRIBUTORS;
  } else if (routeName === 'organization') {
    key = FeatureEventKey.SEARCH_ORGANIZATIONS;
  } else if (routeName === 'activity' && routeHash === '#activity') {
    key = FeatureEventKey.SEARCH_ACTIVITIES;
  } else if (routeName === 'activity' && routeHash === '#conversation') {
    key = FeatureEventKey.SEARCH_CONVERSATIONS;
  } else {
    key = null;
  }

  if (key) {
    trackEvent({
      key,
      type: EventType.FEATURE,
    });
  }

  emit('update:modelValue', search);
}, 300);

</script>

<script lang="ts">
export default {
  name: 'LfFilterSearch',
};
</script>
