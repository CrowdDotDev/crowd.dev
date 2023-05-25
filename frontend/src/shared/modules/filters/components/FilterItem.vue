<template>
  <div>
    <el-button-group>
      <!-- Settings -->
      <el-popover
        :visible="isOpen"
        teleported
        placement="bottom-start"
        width="320"
        trigger="click"
        popper-class="filter-popover !p-0"
      >
        <template #reference>
          <el-button ref="chip" class="filter-item-reference btn btn--bordered !h-8 p-2 !border !outline-none font-medium text-xs" @click="open">
            <span v-html="$sanitize((props.modelValue && config.itemLabelRenderer(props.modelValue)) || config.label)" />
          </el-button>
        </template>

        <div class="filter-base p-3">
          <component :is="getComponent" v-if="getComponent" v-model="form" :config="props.config" v-bind="props.config.options" />
        </div>
        <div class="flex justify-end items-center border-t p-3">
          <el-button class="btn btn--transparent btn--sm mr-2" @click="close">
            Cancel
          </el-button>
          <el-button class="btn btn--primary btn--sm" :disabled="$v.$invalid" @click="apply">
            Apply
          </el-button>
        </div>
      </el-popover>

      <!-- Cancel -->
      <el-button class="btn btn--bordered !w-8 !h-8 p-2 !border !outline-none font-medium text-xs" @click="emit('remove')">
        <span class="ri-close-line block" />
      </el-button>
    </el-button-group>
  </div>
</template>

<script setup lang="ts">
import {
  computed, onMounted, onUnmounted, ref, watch,
} from 'vue';
import { FilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { filterComponentByType } from '@/shared/modules/filters/config/filterComponentByType';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
  modelValue: string,
  open: string;
  config: FilterConfig,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: any): void, (e: 'remove'): void, (e: 'update:open', value: string): void}>();

const form = ref({});

const isOpen = computed({
  get() {
    return props.open === props.config.id;
  },
  set(value) {
    if (value) {
      emit('update:open', props.config.id);
    } else if (props.config.id === props.open) {
      emit('update:open', '');
    }
  },
});

const getComponent = computed(() => {
  const { type, component } = props.config;
  if (type === FilterConfigType.CUSTOM) {
    return component;
  }
  return filterComponentByType[props.config.type];
});

const clickOutsideListener = (event: MouseEvent) => {
  const popoverComponent = document.querySelector('.filter-popover');
  const filterBaseComponent = document.querySelector('.filter-base');
  const referenceComponent = document.querySelector('.filter-item-reference');

  if (
    !(
      popoverComponent === event.target
        || filterBaseComponent?.contains(event.target)
        || referenceComponent?.contains(event.target)
        // we need the following condition to validate clicks
        // on popovers that are not DOM children of this component,
        // since popper is adding fixed components to the body directly
        || event
          .composedPath()
          .some(
            (o) => (o.className
                && typeof o.className.includes !== 'undefined'
                && o.className?.includes('el-popper'))
              || false,
          )
    )
  ) {
    close();
  }
};

onMounted(() => {
  document.addEventListener('click', clickOutsideListener);
});
onUnmounted(() => {
  document.removeEventListener('click', clickOutsideListener);
});

const apply = () => {
  emit('update:modelValue', { ...form.value });
  console.log('apply');
  close();
};

const close = () => {
  isOpen.value = false;
};

const open = () => {
  isOpen.value = true;
};

const $v = useVuelidate();

watch(() => props.modelValue, (value) => {
  form.value = { ...value };
}, { immediate: true, deep: true });
</script>

<script lang="ts">
export default {
  name: 'CrFilterItem',
};
</script>
