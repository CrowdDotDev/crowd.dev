<template>
  <div>
    <!-- Emails editing -->
    <div>
      <app-organization-form-emails-item
        v-for="(_, ei) of model"
        :key="ei"
        v-model="model[ei]"
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
      </app-organization-form-emails-item>
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
  ref, watch,
} from 'vue';
import AppOrganizationFormEmailsItem from '@/modules/organization/components/form/organization-form-emails-item.vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
});

const model = ref([]);

watch(
  props.modelValue,
  (organization, previous) => {
    if (!previous) {
      model.value = organization.emails?.length > 0
        ? organization.emails
        : [''];
    }
  },
  { deep: true, immediate: true },
);

watch(
  model,
  (value) => {
    // Emit updated organization
    emit('update:modelValue', {
      ...props.modelValue,
      emails: value.length ? value : [''],
    });
  },
  { deep: true },
);

const addEmail = () => {
  model.value.push('');
};
const removeEmail = (index) => {
  if (model.value.length > 1) {
    model.value.splice(index, 1);
  } else if (model.value.length > 0) {
    model.value[0] = '';
  }
};
</script>

<script>
export default {
  name: 'AppOrganizationFormEmails',
};
</script>
