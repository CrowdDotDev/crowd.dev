<template>
  <article class="flex items-start">
    <div class="flex flex-grow items-start">
      <app-form-item
        :validation="$v.emails"
        :error-messages="{
          email: 'Email is not valid',
        }"
        class="!mb-0 mr-2 no-margin flex-grow is-error-relative"
      >
        <el-input
          v-model="model.emails[0]"
          :placeholder="placeholder"
          @blur="$v.emails.$touch"
          @change="$v.emails.$touch"
        >
          <template #append>
            <el-select
              v-model="model.roles[0]"
              class="w-32"
              placeholder="Select a role"
              placement="bottom-end"
            >
              <el-option
                v-for="option in roles"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </template>
        </el-input>
      </app-form-item>
    </div>
    <slot name="after" />
  </article>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps } from 'vue';
import { required, email } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import AppFormItem from '@/shared/form/form-item.vue';
import { RoleEnum } from '@/modules/user/types/Roles';

type InvitedUser = {
  emails: string[],
  roles: string[]
}

const roles = [
  {
    value: RoleEnum.ADMIN,
    label: 'Admin',
  },
  {
    value: RoleEnum.READONLY,
    label: 'Read-only',
  },
];

const emit = defineEmits<{(e: 'update:modelValue', value: InvitedUser): void}>();
const props = defineProps<{
  modelValue: InvitedUser,
  placeholder?: string,
}>();

const rules = {
  emails: {
    email,
  },
  roles: {
    required,

  },
};

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value: InvitedUser) {
    emit('update:modelValue', value);
  },
});

const $v = useVuelidate(rules, model);
</script>
