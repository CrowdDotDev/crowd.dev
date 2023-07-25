<template>
  <div>
    <app-form-item
      class="pb-4 !mb-0"
      label="Choose action"
      :required="true"
      :validation="$v.action"
      :error-messages="{
        required: 'This field is required',
      }"
    >
      <el-select
        v-model="form.action"
        placeholder="Select option"
        class="w-full"
        @blur="$v.action.$touch"
      >
        <el-option
          v-for="actionOption of actionOptions"
          :key="actionOption.value"
          :value="actionOption.value"
          :label="actionOption.label"
          class="!h-17 !px-3"
        >
          <div>
            <h6 class="pb-1 text-sm font-normal leading-5">
              {{ actionOption.label }}
            </h6>
            <p class="text-2xs text-gray-500 leading-5 font-normal">
              {{ actionOption.description }}
            </p>
          </div>
        </el-option>
      </el-select>
    </app-form-item>
    <div>
      <app-automation-hubspot-action-contact-list
        v-if="form.action === HubspotAutomationAction.ADD_TO_CONTACT_LIST"
        v-model="form"
      />
      <app-automation-hubspot-action-company-list
        v-else-if="form.action === HubspotAutomationAction.ADD_TO_COMPANY_LIST"
        v-model="form"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed, defineEmits, defineProps, onMounted,
} from 'vue';
import AppFormItem from '@/shared/form/form-item.vue';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import {
  HubspotAutomationTrigger,
} from '@/modules/automation/config/automation-types/hubspot/types/HubspotAutomationTrigger';
import {
  HubspotAutomationAction,
} from '@/modules/automation/config/automation-types/hubspot/types/HubspotAutomationAction';

import AppAutomationHubspotActionContactList from '@/modules/automation/config/automation-types/hubspot/actions/hubspot-action-contact-list.vue';
import AppAutomationHubspotActionCompanyList from '@/modules/automation/config/automation-types/hubspot/actions/hubspot-action-company-list.vue';

interface HubspotActionOption {
  label: string;
  description: string;
  value: string;
}

const props = defineProps<{
  modelValue: any,
  trigger: HubspotAutomationTrigger
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: any)}>();

const defaultValue = {
  list: [],
  data: {},
  operator: 'and',
  filters: {},
  action: '',
  contactList: '',
  companyList: '',
  syncCompanyContacts: false,
};

const form = computed<any>({
  get() {
    return props.modelValue;
  },
  set(value: any) {
    emit('update:modelValue', value);
  },
});

const rules: any = {
  action: {
    required,
  },
};

const $v = useVuelidate(rules, form);

const memberOptions: HubspotActionOption[] = [
  {
    label: 'Add member to a HubSpot contacts list',
    description: 'Send member to HubSpot and add it to a contacts list.',
    value: HubspotAutomationAction.ADD_TO_CONTACT_LIST,
  },
];

const organizationOptions: HubspotActionOption[] = [
  {
    label: 'Add organization to a HubSpot companies list',
    description: 'Send organization to HubSpot and add it to a companies list.',
    value: HubspotAutomationAction.ADD_TO_COMPANY_LIST,
  },
];

const actionOptions = computed<HubspotActionOption[]>(() => {
  if (props.trigger === HubspotAutomationTrigger.MEMBER_ATTRIBUTE_MATCH) {
    return memberOptions;
  }
  if (props.trigger === HubspotAutomationTrigger.ORGANIZATION_ATTRIBUTE_MATCH) {
    return organizationOptions;
  }
  return [];
});

onMounted(() => {
  if (Object.keys(props.modelValue).length === 0) {
    emit('update:modelValue', defaultValue);
  }
});

</script>

<script lang="ts">
export default {
  name: 'AppAutomationHubspotAction',
};
</script>
