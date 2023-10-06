<template>
  <div>
    <el-tooltip
      :disabled="canSyncMembers"
      content="Please enable Contacts syncing in HubSpot integration settings to use this feature"
      placement="bottom"
    >
      <el-checkbox
        v-model="form.syncCompanyContacts"
        class="mb-5 filter-checkbox"
        :disabled="!canSyncMembers"
      >
        <span class="text-xs" :class="canSyncMembers ? 'text-gray-900' : 'text-gray-400'">
          Sync all contacts from the organisations matching your conditions criteria
        </span>
      </el-checkbox>
    </el-tooltip>

    <div v-if="form.syncCompanyContacts" class="flex items-end">
      <div class="ri-corner-down-right-line text-xl mr-4 mb-2 text-gray-400 h-6 flex items-center" />
      <app-form-item
        class="!mb-0 w-full"
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
            :key="list.listId"
            :value="list.listId"
            :label="list.name"
          />
        </el-select>
      </app-form-item>
    </div>
  </div>
</template>

<script lang="ts" setup>
import AppFormItem from '@/shared/form/form-item.vue';
import { computed, defineEmits, defineProps } from 'vue';
import useVuelidate from '@vuelidate/core';
import { useStore } from 'vuex';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { HubspotEntity } from '@/integrations/hubspot/types/HubspotEntity';
import { HubspotLists } from '@/integrations/hubspot/types/HubspotLists';

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
  contactList: {
    required: (value: string) => (form.value.syncCompanyContacts ? !!value : true),
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
