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
        v-model="trigger"
        placeholder="Select option"
        class="w-full"
        @change="collapseOpen = 'filterOptions'"
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
    <div class="filter-options pb-8">
      <el-collapse v-if="trigger" v-model="collapseOpen">
        <el-collapse-item
          title="Filter options"
          name="filterOptions"
        >
          <app-new-activity-filter-options v-if="trigger === 'new_activity'" v-model="settings" />
          <app-new-member-filter-options v-if="trigger === 'new_member'" v-model="settings" />
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppFormItem from '@/shared/form/form-item.vue';
import AppNewActivityFilterOptions
  from '@/modules/automation/config/automation-types/shared/filter-options/new-activity-filter-options.vue';
import AppNewMemberFilterOptions
  from '@/modules/automation/config/automation-types/shared/filter-options/new-member-filter-options.vue';
import { computed, defineEmits, ref } from 'vue';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

interface AutomationTriggerForm {
  trigger: string;
  settings: any;
}

const props = defineProps<AutomationTriggerForm>();

const emit = defineEmits<{(e: 'update:trigger', value: string), (e: 'update:settings', value: any),}>();

const collapseOpen = ref('filterOptions');

const triggerOptions = ref([
  {
    label: 'New activity happened in your community',
    value: 'new_activity',
  },
  {
    label: 'New contributor joined your community',
    value: 'new_member',
  },
]);

const trigger = computed<string>({
  get() {
    return props.trigger;
  },
  set(value: string) {
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

const rules = {
  trigger: {
    required,
  },
};

const $v = useVuelidate<AutomationTriggerForm>(rules, {
  trigger,
  settings,
});
</script>

<script lang="ts">
export default {
  name: 'AppAutomationTriggerMemberActivity',
};
</script>
