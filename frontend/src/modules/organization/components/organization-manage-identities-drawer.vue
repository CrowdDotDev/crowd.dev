<template>
  <app-drawer
    v-model="drawerModel"
    size="600px"
    title="Edit identities"
    custom-class="identities-drawer"
  >
    <template #content>
      <div class="border-t border-gray-200 -mt-4 -mx-6 px-6">
        <app-organization-form-identities
          v-model="organizationModel"
          :record="organization"
          :show-header="false"
          :show-unmerge="true"
          @update:model-value="hasFormChanged = true"
          @unmerge="emit('unmerge', $event)"
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
          :disabled="!hasFormChanged || loading"
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
import AppOrganizationFormIdentities from '@/modules/organization/components/form/organization-form-identities.vue';
import { OrganizationService } from '@/modules/organization/organization-service';
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
const emit = defineEmits(['update:modelValue', 'unmerge']);

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

const hasFormChanged = ref(false);

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleSubmit = async () => {
  loading.value = true;
  OrganizationService.update(props.organization.id, {
    identities: [...organizationModel.value.identities
      .filter((i) => i.username?.length > 0 || i.name?.length > 0 || i.organizationId)
      .map((i) => ({
        ...i,
        platform: i.platform,
        url: i.url,
        name: i.name,
      })),
    ],
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
  name: 'AppOrganizationManageIdentitiesDrawer',
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
