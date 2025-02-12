<template>
  <!-- Project name -->
  <article class="mb-5">
    <lf-field label-text="Project name" :required="true">
      <lf-input
        v-model="form.name"
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
        v-model="form.description"
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
        v-model="form.logo"
        class="h-10"
        :invalid="$v.logo.$invalid && $v.logo.$dirty"
        @blur="$v.logo.$touch()"
        @change="$v.logo.$touch()"
      />
      <lf-field-messages :validation="$v.logo" :error-messages="{ required: 'This field is required' }" />
    </lf-field>
  </article>

  <!-- Collections -->
  <article class="mb-5">
    <lf-field label-text="Collections">
      <el-select v-model="form.collections" multiple placeholder="Select collection(s)" class="w-full">
        <el-option
          v-for="item in collectionStore.collections"
          :key="item.id"
          :label="item.name"
          :value="item"
        />
      </el-select>
    </lf-field>
  </article>

  <!-- Associated company -->
  <article class="mb-5">
    <lf-field label-text="Associated company">
      <el-select v-model="form.organizationId" placeholder="Select company" class="w-full">
        <el-option v-for="item in organizationStore.organizations" :key="item.id" :label="item.displayName" :value="item.id">
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
</template>

<script setup lang="ts">
import LfField from '@/ui-kit/field/Field.vue';
import LfInput from '@/ui-kit/input/Input.vue';
import LfTextarea from '@/ui-kit/textarea/Textarea.vue';
import LfFieldMessages from '@/ui-kit/field-messages/FieldMessages.vue';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import useVuelidate from '@vuelidate/core';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { reactive } from 'vue';
import { useCollectionsStore } from '../../collections/pinia';
import { InsightsProjectAddFormModel } from '../models/insights-project-add-form.model';

const organizationStore = useOrganizationStore();
const collectionStore = useCollectionsStore();
const props = defineProps<{
    form: InsightsProjectAddFormModel;
    rules: any;
}>();
const $v = useVuelidate(props.rules, props.form);

const form = reactive(props.form);

</script>

<script lang="ts">
export default {
  name: 'LfInsightProjectAddDetailsTab',
};
</script>
