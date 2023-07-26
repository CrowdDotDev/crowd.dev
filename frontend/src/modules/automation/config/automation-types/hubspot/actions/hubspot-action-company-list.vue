<template>
  <div>
    <el-tooltip
      :disabled="canSyncMembers"
      content="Please enable Members syncing in HubSpot integration settings to use this feature"
      placement="bottom"
    >
      <el-checkbox
        v-model="form.syncCompanyContacts"
        class="mb-5 filter-checkbox"
        :disabled="!canSyncMembers"
      >
        <span class="text-xs" :class="canSyncMembers ? 'text-gray-900' : 'text-gray-400'">
          Sync all members from the organisations matching your conditions criteria
        </span>
      </el-checkbox>
    </el-tooltip>

    <app-form-item
      class="pb-4 mb-0"
      label="HubSpot companies list"
      :required="true"
      :validation="$v.companyList"
      :error-messages="{
        required: 'This field is required',
      }"
    >
      <el-select
        v-model="form.companyList"
        placeholder="Select option"
        class="w-full"
        @blur="$v.companyList.$touch"
      >
        <el-option
          v-for="list of props.lists.organizations"
          :key="list.id"
          :value="list.id"
          :label="list.name"
        />
      </el-select>
    </app-form-item>
    <app-form-item
      v-if="form.syncCompanyContacts"
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
import { useStore } from 'vuex';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { HubspotEntity } from "@/integrations/hubspot/types/HubspotEntity";
import { HubspotLists } from "@/integrations/hubspot/types/HubspotLists";

const store = useStore();

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

const rules: any = computed(() => ({
  companyList: {
    required,
  },
  contactList: {
    required: (value: string) => (form.value.syncCompanyContacts ? value.length > 0 : true),
  },
}));

const canSyncMembers = computed(() => {
  const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
  const enabledFor = hubspot.settings?.enabledFor || [];
  return enabledFor.includes(HubspotEntity.MEMBERS);
});

const $v = useVuelidate(rules, form);
</script>

<script lang="ts">
export default {
  name: 'AppAutomationHubspotActionCompanyList',
};
</script>
