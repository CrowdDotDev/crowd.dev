<template>
  <app-form-item
    label="Invite the users you want to be part of your workspace"
    :validation="$v.invitedUsers"
  >
    <div class="flex flex-col gap-4">
      <app-onboard-user-array-input
        v-for="(_, ii) of form.invitedUsers"
        :key="ii"
        v-model="form.invitedUsers[ii]"
        placeholder="Enter email"
      >
        <template #after>
          <el-button
            v-if="form.invitedUsers.length > 1"
            class="btn btn--md btn--transparent w-10 h-10"
            @click="removeUser(ii)"
          >
            <i class="ri-delete-bin-line text-lg" />
          </el-button>
        </template>
      </app-onboard-user-array-input>
    </div>
  </app-form-item>

  <el-button class="btn btn-link btn-link--primary" @click="addUser()">
    + Add user
  </el-button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppFormItem from '@/shared/form/form-item.vue';
import useVuelidate from '@vuelidate/core';
import AppOnboardUserArrayInput from '@/modules/onboard/components/onboard-user-array-input.vue';
import { RoleEnum } from '@/modules/user/types/Roles';

type Form = {
  invitedUsers: {
    emails: string[];
    roles: string[];
  }[]
}

const emit = defineEmits<{(e: 'update:modelValue', value: Form): void}>();
const props = defineProps<{
  modelValue: Form,
}>();
const form = computed<Form>({
  get() {
    return props.modelValue;
  },
  set(value: Form) {
    emit('update:modelValue', {
      ...props.modelValue,
      invitedUsers: value.invitedUsers,
    });
  },
});

const $v = useVuelidate({}, form);

const addUser = () => {
  form.value.invitedUsers.push({
    emails: [],
    roles: [RoleEnum.ADMIN],
  });
};

const removeUser = (index: number) => {
  form.value.invitedUsers.splice(index, 1);
};
</script>
