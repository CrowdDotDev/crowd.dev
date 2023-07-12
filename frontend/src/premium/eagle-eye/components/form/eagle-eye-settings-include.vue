<template>
  <article class="pb-3 flex items-center">
    <div class="flex flex-grow items-start">
      <app-form-item
        :validation="$v.keyword"
        :error-messages="{
          required: 'This field is required',
        }"
        class="mr-3 mb-0 no-margin basis-7/12 is-error-relative"
      >
        <el-input
          v-model="include.keyword"
          placeholder="Keyword"
          @blur="$v.keyword.$touch"
          @change="$v.keyword.$touch"
        />
      </app-form-item>
      <app-form-item
        class="mr-3 mb-0 no-margin basis-5/12 is-error-relative"
      >
        <el-select
          v-model="include.match"
          class="w-full"
          placeholder="Match type"
        >
          <el-option
            value="semantic"
            label="Semantic match"
            class="flex-col !items-start !px-3 !py-2.5 !h-16 no-checkmark"
          >
            <h6 class="text-xs leading-5 font-medium">
              Semantic match
            </h6>
            <p class="text-2xs leading-5 text-gray-500">
              Results semantically related
            </p>
          </el-option>
          <el-option
            value="exact"
            label="Exact match"
            class="flex-col !items-start !px-3 !py-2.5 !h-16 no-checkmark"
          >
            <h6 class="text-xs leading-5 font-medium">
              Exact match
            </h6>
            <p class="text-2xs leading-5 text-gray-500">
              Results containing the keyword
            </p>
          </el-option>
        </el-select>
      </app-form-item>
    </div>
    <slot name="after" />
  </article>
</template>

<script setup>
import { computed } from 'vue';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import AppFormItem from '@/shared/form/form-item.vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const rules = {
  keyword: {
    required,
  },
};

const include = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const $v = useVuelidate(rules, include);
</script>

<script>
export default {
  name: 'AppEagleEyeSettingsInclude',
};
</script>
