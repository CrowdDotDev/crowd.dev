<template>
  <!-- Project name -->
  <article class="mb-5">
    <lf-field label-text="Keyword(s)">
      <div class="text-tiny text-gray-500 mb-1">
        <p class="mb-1">
          Add keywords to your project. These keywords will be used to search for
          repositories and projects that match the keywords.
        </p>
        <ul class="list-disc pl-4">
          <li>Social mentions</li>
          <li>Press mentions</li>
          <li>Search queries (powered by Google Trends)</li>
        </ul>
      </div>
      <el-input-tag
        v-model="form.keywords"
        placeholder="Enter keword(s)"
      />
      <el-select
        v-model="form.keywords"
        placeholder="Enter keword(s)"
        class="w-full"
        placement="bottom-end"
        multiple
        filterable
        :allow-create="true"
        :teleported="false"
      />
    </lf-field>
  </article>
</template>

<script setup lang="ts">
import LfField from '@/ui-kit/field/Field.vue';
import { reactive } from 'vue';
import { InsightsProjectAddFormModel } from '../models/insights-project-add-form.model';

const props = defineProps<{
  form: InsightsProjectAddFormModel;
}>();
const form = reactive(props.form);
</script>

<script lang="ts">
export default {
  name: 'LfInsightsProjectAddAdvancedTab',
};
</script>
