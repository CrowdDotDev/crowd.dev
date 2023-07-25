<template>
  <div>
    <app-form-item
      class="mb-6"
      label="Choose trigger"
      :required="true"
      :validation="$v.trigger"
      :error-messages="{
        required: 'This field is required',
      }"
    >
      <el-select
        v-model="trigger"
        placeholder="Select option"
        class="w-full"
        @blur="$v.trigger.$touch"
        @change="resetFilterForm()"
      >
        <el-option
          v-for="{ value, label } of triggerOptions"
          :key="value"
          :value="value"
          :label="label"
        />
      </el-select>
    </app-form-item>
    <section v-if="trigger">
      <!-- Header -->
      <div class="flex justify-between items-center pb-3 pr-12">
        <p class="text-xs leading-5 font-semibold">
          Condition(s)
        </p>
        <el-dropdown v-if="settings.list?.length > 0" placement="bottom-end">
          <p class="text-xs leading-5 font-medium text-gray-900">
            Matching {{ settings.operator === 'and' ? 'all' : 'any' }} <i class="ri-arrow-down-s-line" />
          </p>
          <template #dropdown>
            <el-dropdown-item
              class="flex items-center justify-between"
              :class="{ 'bg-brand-50': settings.operator === 'and' }"
              @click="settings.operator = 'and'"
            >
              Matching all
              <i
                :class="settings.operator === 'and' ? 'opacity-100' : 'opacity-0'"
                class="ri-check-line !text-brand-500 !mr-0 ml-1"
              />
            </el-dropdown-item>
            <el-dropdown-item
              class="flex items-center justify-between"
              :class="{ 'bg-brand-50': settings.operator === 'or' }"
              @click="settings.operator = 'or'"
            >
              Matching any
              <i
                :class="settings.operator === 'or' ? 'opacity-100' : 'opacity-0'"
                class="ri-check-line !text-brand-500 !mr-0 ml-1"
              />
            </el-dropdown-item>
          </template>
        </el-dropdown>
      </div>

      <div>
        <div v-for="filter of settings.list" :key="filter" class="flex items-center mb-3">
          <cr-filter-item
            v-model="settings.data[filter]"
            v-model:open="open"
            :config="filterConfigs[filter]"
            :hide-remove="true"
            class="flex-grow"
            chip-classes="w-full !h-10"
          />
          <div
            class="ml-2 h-10 w-10 flex items-center justify-center cursor-pointer"
            @click="removeFilter(filter)"
          >
            <i class="ri-delete-bin-line text-lg h-5 flex items-center" />
          </div>
        </div>
      </div>

      <div class="pt-1">
        <el-dropdown placement="bottom-start">
          <p class="text-brand-500 text-xs leading-5 font-medium cursor-pointer">
            + Add condition
          </p>
          <template #dropdown>
            <el-dropdown-item
              v-for="(config, key) in filterConfigs"
              :key="key"
              @click="addFilter(key)"
            >
              {{ config.label }}
            </el-dropdown-item>
          </template>
        </el-dropdown>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  computed, defineEmits, ref,
} from 'vue';
import AppFormItem from '@/shared/form/form-item.vue';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import {
  HubspotAutomationTrigger,
} from '@/modules/automation/config/automation-types/hubspot/types/HubspotAutomationTrigger';
import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import CrFilterItem from '@/shared/modules/filters/components/FilterItem.vue';
import { useStore } from 'vuex';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import {
  hubspotMemberFilters,
  hubspotOrganizationFilters,
} from '@/modules/automation/config/automation-types/hubspot/config';

const props = defineProps<{
  trigger: HubspotAutomationTrigger,
  settings: any,
}>();

const emit = defineEmits<{(e: 'update:trigger', value: HubspotAutomationTrigger),
  (e: 'update:settings', value: any),
}>();

const store = useStore();

const trigger = computed<HubspotAutomationTrigger>({
  get() {
    return props.trigger;
  },
  set(value: HubspotAutomationTrigger) {
    emit('update:trigger', value);
  },
});

const settings = computed<any>({
  get() {
    return props.settings;
  },
  set(value: any) {
    emit('update:settings', value);
  },
});

const triggerOptions = computed(() => {
  const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
  // TODO: remove test properties when merged and change to enum
  const enabledFor = hubspot.settings?.enabledFor || ['members', 'organizations'];
  return [
    ...(enabledFor.includes('members') ? [{
      label: 'Member attributes match condition(s)',
      value: HubspotAutomationTrigger.MEMBER_ATTRIBUTE_MATCH,
    }] : []),
    ...(enabledFor.includes('organizations') ? [{
      label: 'Organization attributes match condition(s)',
      value: HubspotAutomationTrigger.ORGANIZATION_ATTRIBUTE_MATCH,
    }] : []),
  ];
});

const filterConfigs = computed<Record<string, FilterConfig>>(() => {
  if (trigger.value === HubspotAutomationTrigger.MEMBER_ATTRIBUTE_MATCH) {
    return hubspotMemberFilters;
  }
  if (trigger.value === HubspotAutomationTrigger.ORGANIZATION_ATTRIBUTE_MATCH) {
    return hubspotOrganizationFilters;
  }
  return {} as Record<string, FilterConfig>;
});

const rules = {
  trigger: {
    required,
  },
};

const $v = useVuelidate(rules, {
  trigger,
  settings,
});

const open = ref('');
const addFilter = (key: string) => {
  settings.value.list.push(key);
  open.value = key;
};

const removeFilter = (key) => {
  open.value = '';
  settings.value.list = settings.value.list.filter((el) => el !== key);
  delete settings.value.data[key];
};

const resetFilterForm = () => {
  open.value = '';
  settings.value.list = [];
  settings.value.data = {};
  settings.value.operator = 'and';
};

</script>

<script lang="ts">
export default {
  name: 'AppAutomationHubspotTrigger',
};
</script>
