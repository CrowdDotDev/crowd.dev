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
      <lf-field-messages :validation="$v.name" :error-messages="{ required: 'This field is required' }" />
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
      <lf-field-messages :validation="$v.description" :error-messages="{ required: 'This field is required' }" />
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
      <lf-field-messages :validation="$v.logoUrl" :error-messages="{ required: 'This field is required' }" />
    </lf-field>
  </article>

  <!-- Collections -->
  <article class="mb-5">
    <lf-field label-text="Collections">
      <el-select v-model="cForm.collectionsIds" multiple placeholder="Select collection(s)" class="w-full">
        <el-option v-for="item in collectionsOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </lf-field>
  </article>

  <!-- Associated company -->
  <article class="mb-5">
    <lf-field label-text="Associated company">
      <el-select v-model="cForm.organizationId" placeholder="Select company" class="w-full">
        <template #label="{ label, value }">
          <span>{{ label }}: </span>
          <span style="font-weight: bold">{{ value }}</span>
        </template>
        <el-option v-for="item in organizations" :key="item.id" :label="item.displayName" :value="item.id">
          <lf-avatar
            :src="item.logo"
            :name="item.displayName"
            :size="24"
            class="!rounded-md border border-gray-200"
          />
          <span class="ml-2 text-gray-900 text-sm">{{ item.displayName }}</span>
        </el-option>
      </el-select>
    </lf-field>
  </article>

  <hr class="my-5" />

  <h6 class="font-semibold mb-6">
    Website & Social accounts
  </h6>

  <!-- Website -->
  <article class="mb-5">
    <lf-field label-text="Website" :required="true">
      <lf-input
        v-model="cForm.website"
        class="h-10"
        :invalid="$v.website.$invalid && $v.website.$dirty"
        placeholder="https://www.example.com"
        @blur="$v.website.$touch()"
        @change="$v.website.$touch()"
      />
      <lf-field-messages :validation="$v.website" :error-messages="{ required: 'This field is required' }" />
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
      <lf-icon class="mr-2.5 text-[#2867B2]" name="linkedin" :size="25" type="brands" />
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
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import useVuelidate from '@vuelidate/core';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { computed, reactive } from 'vue';
import { useCollectionsStore } from '../../collections/pinia';
import { InsightsProjectAddFormModel } from '../models/insights-project-add-form.model';

const organizationStore = useOrganizationStore();
const collectionStore = useCollectionsStore();

const props = defineProps<{
    form: InsightsProjectAddFormModel;
    rules: any;
}>();
const cForm = reactive(props.form);
const $v = useVuelidate(props.rules, cForm);

const collectionsOptions = computed(() => collectionStore.getCollections() || []);
const organizations = computed(() => organizationStore.getOrganizations() || []);
</script>

<script lang="ts">
export default {
  name: 'LfInsightsProjectAddDetailsTab',
};
</script>
