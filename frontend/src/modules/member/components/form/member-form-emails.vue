<template>
  <div>
    <!-- Emails editing -->
    <div>
      <app-member-form-emails-item
        v-for="(_, ei) of computedModelEmails"
        :key="ei"
        v-model="computedModelEmails[ei]"
        class="pb-3"
      >
        <template #actions>
          <el-button
            class="btn btn--md btn--transparent w-10 h-10"
            @click="removeEmail(ei)"
          >
            <i class="ri-delete-bin-line text-lg" />
          </el-button>
        </template>
      </app-member-form-emails-item>
      <div class="flex">
        <div class="text-xs font-medium text-brand-500 cursor-pointer" @click="addEmail()">
          + Add email address
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
} from 'vue';
import AppMemberFormEmailsItem from '@/modules/member/components/form/member-form-emails-item.vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
});

const model = computed({
  get() {
    return props.modelValue;
  },
  set(contact) {
    emit('update:modelValue', contact);
  },
});

const computedModelEmails = computed({
  get() {
    return model.value.emails?.length > 0
      ? model.value.emails
      : [''];
  },
  set(emails) {
    model.value.emails = emails.filter((e) => !!e);
  },
});

const addEmail = () => {
  computedModelEmails.value.push('');
};
const removeEmail = (index) => {
  computedModelEmails.value.splice(index, 1);
};
</script>

<script>
export default {
  name: 'AppMemberFormEmails',
};
</script>
