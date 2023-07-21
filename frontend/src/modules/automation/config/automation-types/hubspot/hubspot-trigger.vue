<template>
  <div>
    <app-form-item
      class="mb-4"
      label="Choose trigger"
      :required="true"
      :validation="$v.trigger"
      :error-messages="{
        required: 'This field is required',
      }"
    >
      <el-select
        v-model="form.trigger"
        placeholder="Select option"
        class="w-full"
        @blur="$v.trigger.$touch"
      >
        <el-option
          v-for="{ value, label } of triggerOptions"
          :key="value"
          :value="value"
          :label="label"
        />
      </el-select>
    </app-form-item>
  </div>
</template>

<script setup lang="ts">
import {
  computed, defineEmits, reactive, ref,
} from 'vue';
import AppFormItem from '@/shared/form/form-item.vue';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';

const props = defineProps<{
  trigger: string,
  settings: any,
}>();

const emit = defineEmits<{(e: 'update:trigger', value: string), (e: 'update:settings', value: any),}>();

const trigger = computed<string>({
  get() {
    return props.trigger;
  },
  set(trigger: string) {
    emit('update:trigger', trigger);
  },
});

const settings = computed<any>({
  get() {
    return props.settings;
  },
  set(trigger: any) {
    emit('update:settings', trigger);
  },
});

const triggerOptions = ref([
  {
    label: 'Member attributes match condition(s)',
    value: 'member_attributes_match',
  },
  {
    label: 'Organization attributes match condition(s)',
    value: 'organization_attributes_match',
  },
]);

const form = reactive({
  trigger: '',
  settings: {},
});

const rules = {
  trigger: {
    required,
  },
};

const $v = useVuelidate(rules, form);
</script>

<script lang="ts">
export default {
  name: 'AppAutomationHubspotTrigger',
};
</script>
