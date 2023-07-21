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
      <el-collapse v-if="form.trigger" v-model="collapseOpen">
        <el-collapse-item
          title="Filter options"
          name="filterOptions"
        >
          <app-new-activity-filter-options v-if="form.trigger === 'new_activity'" v-model="form.settings" />
          <app-new-member-filter-options v-if="form.trigger === 'new_member'" v-model="form.settings" />
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
</script>

<script lang="ts">
export default {
  name: 'AppAutomationTriggerMemberActivity',
};
</script>
