<template>
  <div>
    <!-- Emails editing -->
    <div>
      <app-organization-form-emails-item
        v-for="(_, ei) of model"
        :key="ei"
        v-model="model[ei].value"
        class="pb-3"
      >
        <template #actions>
          <el-button
            class="btn btn--md btn--transparent w-10 h-10"
            @click="removeEmail(ei)"
          >
          <lf-icon name="trash-can" :size="20" />
          </el-button>
        </template>
      </app-organization-form-emails-item>
      <div class="flex">
        <div class="text-xs font-medium text-primary-500 cursor-pointer" @click="addEmail()">
          + Add email address
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref, watch,
} from 'vue';
import AppOrganizationFormEmailsItem from '@/modules/organization/components/form/organization-form-emails-item.vue';
import { Platform } from '@/shared/modules/platform/types/Platform';
import { Organization, OrganizationIdentityType, OrganizationIdentity } from '../../types/Organization';
import LfIcon from '@/ui-kit/icon/Icon.vue';
const emit = defineEmits<{(e: 'update:modelValue', value: Organization): void }>();

const props = defineProps<{
  modelValue: Organization;

}>();

const model = ref<OrganizationIdentity[]>([]);

watch(
  props.modelValue,
  (organization, previous) => {
    if (!previous) {
      model.value = organization.identities.filter((i) => [OrganizationIdentityType.EMAIL].includes(i.type)) || [{
        value: '',
        platform: Platform.CUSTOM,
        type: OrganizationIdentityType.EMAIL,
        verified: true,
      }];
    }
  },
  { deep: true, immediate: true },
);

watch(
  model,
  (value) => {
    const otherIdentities = props.modelValue.identities.filter((i) => ![OrganizationIdentityType.EMAIL].includes(i.type));

    // Emit updated organization
    emit('update:modelValue', {
      ...props.modelValue,
      identities: [...otherIdentities, ...value],
    });
  },
  { deep: true },
);

const addEmail = () => {
  model.value.push({
    value: '',
    platform: Platform.CUSTOM,
    type: OrganizationIdentityType.EMAIL,
    verified: true,
  });
};
const removeEmail = (index: number) => {
  if (model.value.length > 1) {
    model.value.splice(index, 1);
  } else if (model.value.length > 0) {
    model.value[0] = {
      value: '',
      platform: Platform.CUSTOM,
      type: OrganizationIdentityType.EMAIL,
      verified: true,
    };
  }
};
</script>

<script lang="ts">
export default {
  name: 'AppOrganizationFormEmails',
};
</script>
