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
        :disabled="!props.trigger"
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
        :lists="lists"
      />
      <app-automation-hubspot-action-company-list
        v-else-if="form.action === HubspotAutomationAction.ADD_TO_COMPANY_LIST"
        v-model="form"
        :lists="lists"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed, defineEmits, defineProps, onMounted, ref, watch,
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
import { HubspotApiService } from '@/integrations/hubspot/hubspot.api.service';
import { HubspotLists } from '@/integrations/hubspot/types/HubspotLists';

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

const lists = ref<HubspotLists>({
  members: [],
  organizations: [],
});

const defaultValue = {
  list: [],
  data: {},
  operator: 'and',
  filter: {},
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

watch(() => props.trigger, () => {
  if (props.trigger && actionOptions.value.length > 0) {
    form.value.action = actionOptions.value[0].value;
  }
});

const memberOptions: HubspotActionOption[] = [
  {
    label: 'Add contributor to a HubSpot contacts list',
    description: 'Send contributor to HubSpot and add it to a contacts list.',
    value: HubspotAutomationAction.ADD_TO_CONTACT_LIST,
  },
];

const organizationOptions: HubspotActionOption[] = [
  {
    label: 'Create company(ies) in HubSpot',
    description: 'Send organization(s) to HubSpot matching your conditions criteria.',
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

const getLists = () => {
  HubspotApiService.getLists()
    .then((hubspotLists) => {
      lists.value = hubspotLists;
    })
    .catch(() => {
      lists.value = {
        members: [],
        organizations: [],
      };
    });
};

onMounted(() => {
  if (Object.keys(props.modelValue).length === 0) {
    emit('update:modelValue', defaultValue);
  }
  getLists();
});

</script>

<script lang="ts">
export default {
  name: 'AppAutomationHubspotAction',
};
</script>
