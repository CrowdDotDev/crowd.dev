<template>
  <!-- Project name -->
  <article class="mb-5">
    <lf-field label-text="Project name" :required="true">
      <lf-input
        v-model="cForm.name"
        class="h-10"
        :invalid="$v.name.$invalid && $v.name.$dirty"
        @blur="$v.name.$touch()"
        @change="$v.name.$touch()"
      />
      <lf-field-messages
        :validation="$v.name"
        :error-messages="{ required: 'This field is required' }"
      />
    </lf-field>
  </article>

  <!-- Description -->
  <article class="mb-5">
    <lf-field label-text="Description" :required="true">
      <lf-textarea
        v-model="cForm.description"
        :invalid="$v.description.$invalid && $v.description.$dirty"
        @blur="$v.description.$touch()"
        @change="$v.description.$touch()"
      />
      <lf-field-messages
        :validation="$v.description"
        :error-messages="{ required: 'This field is required' }"
      />
    </lf-field>
  </article>

  <!-- Logo -->
  <article class="mb-5">
    <lf-field label-text="Logo URL" :required="true">
      <lf-input
        v-model="cForm.logoUrl"
        class="h-10"
        :invalid="$v.logoUrl.$invalid && $v.logoUrl.$dirty"
        @blur="$v.logoUrl.$touch()"
        @change="$v.logoUrl.$touch()"
      />
      <lf-field-messages
        :validation="$v.logoUrl"
        :error-messages="{ required: 'This field is required' }"
      />
    </lf-field>
  </article>

  <!-- Collections -->
  <article class="mb-5">
    <lf-field label-text="Collections">
      <lf-insights-projects-add-collection-dropdown :form="cForm" />
    </lf-field>
  </article>

  <!-- Associated company -->
  <article class="mb-5">
    <lf-field label-text="Associated company">
      <lf-insights-projects-add-organizations-dropdown v-if="cForm.segmentId" :form="cForm" />
    </lf-field>
  </article>

  <hr class="my-5" />

  <h6 class="font-semibold mb-6">
    Website & Social accounts
  </h6>

  <!-- Website -->
  <article class="mb-5">
    <lf-field label-text="Website">
      <lf-input
        v-model="cForm.website"
        class="h-10"
        placeholder="https://www.example.com"
      />
      <lf-field-messages
        :validation="$v.website"
        :error-messages="{ required: 'This field is required' }"
      />
    </lf-field>
    <div class="flex items-center mt-6">
      <lf-icon class="mr-2.5" name="github" :size="25" type="brands" />
      <lf-input
        v-model="cForm.github"
        class="h-10 flex-grow"
        placeholder="Enter GitHub repository URL"
      />
    </div>
    <div class="flex items-center mt-3">
      <lf-icon
        class="mr-2.5 text-[#2867B2]"
        name="linkedin"
        :size="25"
        type="brands"
      />
      <lf-input
        v-model="cForm.linkedin"
        class="h-10 flex-grow"
        placeholder="Enter LinkedIn URL"
      />
    </div>
    <div class="flex items-center mt-3">
      <lf-icon class="mr-2.5" name="x-twitter" :size="25" type="brands" />
      <lf-input
        v-model="cForm.twitter"
        class="h-10 flex-grow"
        placeholder="Enter X/Twitter URL"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
import LfField from '@/ui-kit/field/Field.vue';
import LfInput from '@/ui-kit/input/Input.vue';
import LfTextarea from '@/ui-kit/textarea/Textarea.vue';
import LfFieldMessages from '@/ui-kit/field-messages/FieldMessages.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import useVuelidate from '@vuelidate/core';
import { reactive } from 'vue';
import { InsightsProjectAddFormModel } from '../models/insights-project-add-form.model';
import LfInsightsProjectsAddCollectionDropdown from './add-details-tab/lf-insights-projects-add-collection-dropdown.vue';
import LfInsightsProjectsAddOrganizationsDropdown from './add-details-tab/lf-insights-projects-add-organizations-dropdown.vue';

const props = defineProps<{
  form: InsightsProjectAddFormModel;
  rules: any;
}>();
const cForm = reactive(props.form);
const $v = useVuelidate(props.rules, cForm);

</script>

<script lang="ts">
export default {
  name: 'LfInsightsProjectAddDetailsTab',
};
</script>
