<template>
  <el-popover placement="bottom-start" trigger="click" popper-class="!p-0" width="20rem" v-model:visible="visible">
    <template #reference>
      <cr-button type="secondary" size="small">
        <i class="ri-command-line" /> <p>Confidence level: <span class="font-normal">{{ label }}</span></p>
      </cr-button>
    </template>

    <div class="pt-1.5 pb-2 px-2">
      <article
        class="px-3 py-2.5 leading-5 font-xs flex justify-between items-center transition cursor-pointer rounded-md hover:bg-gray-50"
        :class="model.length === 0 ? '!bg-brand-50' : ''"
        @click="model = []"
      >
        <span class="text-black">All confidence levels</span>
        <i v-if="model.length === 0" class="ri-check-line text-lg text-primary-600" />
      </article>
    </div>
    <div class="p-2 border-t border-gray-100 flex flex-col gap-1">
      <label
        class="px-3 py-2.5 leading-5 font-xs flex items-center transition cursor-pointer rounded-md hover:bg-gray-50"
      >
        <cr-checkbox v-model="model" value="high" />
        <div class="ml-1 mr-2 h-2 w-2 rounded-full bg-green-600" />
        <p class="text-black text-xs">
          High <span class="text-gray-500">(90% - 100%)</span>
        </p>
      </label>
      <label
        class="px-3 py-2.5 leading-5 font-xs flex items-center transition cursor-pointer rounded-md hover:bg-gray-50"
      >
        <cr-checkbox v-model="model" value="medium" />
        <div class="ml-1 mr-2 h-2 w-2 rounded-full bg-blue-600" />
        <p class="text-black text-xs">
          Medium <span class="text-gray-500">(70% - 89%)</span>
        </p>
      </label>
      <label
        class="px-3 py-2.5 leading-5 font-xs flex items-center transition cursor-pointer rounded-md hover:bg-gray-50"
      >
        <cr-checkbox v-model="model" value="low" />
        <div class="ml-1 mr-2 h-2 w-2 rounded-full bg-yellow-600" />
        <p class="text-black text-xs">
          Low <span class="text-gray-500">(&lt;69%)</span>
        </p>
      </label>
    </div>
    <div class="py-3 px-4 border-t border-gray-100 flex justify-end gap-3">
      <cr-button size="small" type="tertiary-gray" @click="visible = false">
        Cancel
      </cr-button>
      <cr-button size="small" type="primary" @click="apply()">
        Apply
      </cr-button>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import CrButton from '@/ui-kit/button/Button.vue';
import CrCheckbox from '@/ui-kit/checkbox/Checkbox.vue';

const props = defineProps<{
  modelValue: string[]
}>();

const visible = ref<boolean>(false);

const model = ref<string[]>(props.modelValue);

const emit = defineEmits<{(e: 'update:modelValue', value: string[]): void}>();

const label = computed(() => {
  if(props.modelValue.length > 0){
    return props.modelValue.map((l) => l.charAt(0).toUpperCase() + l.substring(1)).join(', ');
  }
  return 'All'
})

const apply = () => {
  emit('update:modelValue', model.value);
  visible.value = false;
}
</script>

<script lang="ts">
export default {
  name: 'AppMergeSuggestionsConfidenceFilter',
};
</script>
