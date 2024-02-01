<template>
  <app-drawer
    v-model="drawerModel"
    size="480px"
    title="Edit emails"
    custom-class="emails-drawer"
  >
    <template #content>
      <div class="border-t border-gray-200 -mt-4 -mx-6 px-6 pt-5">
        <p class="text-sm font-medium text-gray-900 mb-2">
          Email address
        </p>
        <app-organization-form-emails
          v-model="organizationModel"
          @update:model-value="hasFormChanged = true"
        />
      </div>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button
          class="btn btn--md btn--bordered mr-3"
          @click="handleCancel"
        >
          Cancel
        </el-button>
        <el-button
          type="primary"
          :disabled="$v.$invalid || !hasFormChanged || loading"
          class="btn btn--md btn--primary"
          :loading="loading"
          @click="handleSubmit"
        >
          Update
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import {
  ref,
  computed,
} from 'vue';
import Message from '@/shared/message/message';
import cloneDeep from 'lodash/cloneDeep';
import { OrganizationService } from '@/modules/organization/organization-service';
import AppOrganizationFormEmails from '@/modules/organization/components/form/organization-form-emails.vue';
import useVuelidate from '@vuelidate/core';
import { useOrganizationStore } from '@/modules/organization/store/pinia';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  organization: {
    type: Object,
    default: () => {},
  },
});
const emit = defineEmits(['update:modelValue']);

const organizationStore = useOrganizationStore();
const { fetchOrganization } = organizationStore;

const drawerModel = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const organizationModel = ref(cloneDeep(props.organization));
const loading = ref(false);

const $v = useVuelidate({}, organizationModel);

const hasFormChanged = ref(false);

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleSubmit = async () => {
  loading.value = true;
  OrganizationService.update(props.organization.id, {
    emails: organizationModel.value.emails,
  }).then(() => {
    fetchOrganization(props.organization.id).then(() => {
      Message.success('Organization identities updated successfully');
    });
  }).catch((err) => {
    Message.error(err.response.data);
  }).finally(() => {
    loading.value = false;
  });
  emit('update:modelValue', false);
};
</script>

<script>
export default {
  name: 'AppOrganizationManageEmailsDrawer',
};
</script>

<style lang="scss">
.identities-drawer {
  .el-form-item,
  .el-form-item__content {
    @apply mb-0;
  }
}
</style>
