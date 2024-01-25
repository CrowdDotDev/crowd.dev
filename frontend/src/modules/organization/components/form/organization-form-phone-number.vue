<template>
  <div>
    <!-- Emails editing -->
    <div>
      <app-organization-form-phone-number-item
        v-for="(_, ei) of computedModelPhoneNumbers"
        :key="ei"
        v-model="computedModelPhoneNumbers[ei]"
        class="pb-3"
      >
        <template #actions>
          <el-button
            class="btn btn--md btn--transparent w-10 h-10"
            @click="removePhoneNumber(ei)"
          >
            <i class="ri-delete-bin-line text-lg" />
          </el-button>
        </template>
      </app-organization-form-phone-number-item>
      <div class="flex">
        <div class="text-xs font-medium text-brand-500 cursor-pointer" @click="addPhoneNumber()">
          + Add phone number
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
} from 'vue';
import AppOrganizationFormPhoneNumberItem
  from '@/modules/organization/components/form/organization-form-phone-number-item.vue';

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

const computedModelPhoneNumbers = computed({
  get() {
    return model.value.phoneNumbers?.length > 0
      ? model.value.phoneNumbers
      : [''];
  },
  set(phoneNumbers) {
    model.value.phoneNumbers = phoneNumbers.filter((e) => !!e);
  },
});

const addPhoneNumber = () => {
  computedModelPhoneNumbers.value.push('');
};
const removePhoneNumber = (index) => {
  if (computedModelPhoneNumbers.value.length > 1) {
    computedModelPhoneNumbers.value.splice(index, 1);
  } else if (computedModelPhoneNumbers.value.length > 0) {
    computedModelPhoneNumbers.value[0] = '';
  }
};
</script>

<script>
export default {
  name: 'AppOrganizationFormPhoneNumber',
};
</script>
