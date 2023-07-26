<template>
  <div class="pt-2">
    <app-form-item
      class="pb-4"
      label="HubSpot contacts list"
      :required="true"
      :validation="$v.contactList"
      :error-messages="{
        required: 'This field is required',
      }"
    >
      <el-select
        v-model="form.contactList"
        placeholder="Select option"
        class="w-full"
        @blur="$v.contactList.$touch"
      >
        <el-option
          v-for="list of props.lists.members"
          :key="list.id"
          :value="list.id"
          :label="list.name"
        />
      </el-select>
    </app-form-item>
  </div>
</template>

<script lang="ts" setup>
import AppFormItem from '@/shared/form/form-item.vue';
import { computed, defineEmits, defineProps } from 'vue';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import { HubspotLists } from '@/integrations/hubspot/types/HubspotLists';

const props = defineProps<{
  modelValue: any,
  lists: HubspotLists,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: any)}>();

const form = computed<any>({
  get() {
    return props.modelValue;
  },
  set(value: any) {
    emit('update:modelValue', value);
  },
});

const rules: any = {
  contactList: {
    required,
  },
};

const $v = useVuelidate(rules, form);
</script>

<script lang="ts">
export default {
  name: 'AppAutomationHubspotActionContactList',
};
</script>
